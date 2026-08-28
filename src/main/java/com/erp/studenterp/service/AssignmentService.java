package com.erp.studenterp.service;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.*;
import com.erp.studenterp.exception.BadRequestException;
import com.erp.studenterp.exception.ForbiddenException;
import com.erp.studenterp.exception.NotFoundException;
import com.erp.studenterp.repository.AssignmentRepository;
import com.erp.studenterp.repository.AssignmentSubmissionRepository;
import com.erp.studenterp.repository.FacultySubjectRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final FacultySubjectRepository facultySubjectRepository;
    private final FileStorageService fileStorageService;
    private final ProfileService profileService;

    // ---------------------------------------------------------------- faculty

    @Transactional
    public AssignmentResponse create(String facultyEmail, AssignmentRequest request) {

        Faculty faculty = profileService.requireFaculty(facultyEmail);
        FacultySubject allocation = requireOwnAllocation(faculty, request.getFacultySubjectId());

        Assignment assignment = Assignment.builder()
                .facultySubject(allocation)
                .title(request.getTitle().trim())
                .description(request.getDescription() == null
                        ? null : request.getDescription().trim())
                .dueDate(request.getDueDate())
                .maxMarks(request.getMaxMarks())
                .active(true)
                .build();

        return toFacultyResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public AssignmentResponse update(String facultyEmail, Long assignmentId, AssignmentRequest request) {

        Faculty faculty = profileService.requireFaculty(facultyEmail);
        Assignment assignment = requireOwnAssignment(faculty, assignmentId);
        FacultySubject allocation = requireOwnAllocation(faculty, request.getFacultySubjectId());

        assignment.setFacultySubject(allocation);
        assignment.setTitle(request.getTitle().trim());
        assignment.setDescription(request.getDescription() == null
                ? null : request.getDescription().trim());
        assignment.setDueDate(request.getDueDate());
        assignment.setMaxMarks(request.getMaxMarks());

        return toFacultyResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public void delete(String facultyEmail, Long assignmentId) {

        Faculty faculty = profileService.requireFaculty(facultyEmail);
        Assignment assignment = requireOwnAssignment(faculty, assignmentId);

        assignment.setActive(false);
        assignmentRepository.save(assignment);
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> facultyAssignments(String facultyEmail) {

        Faculty faculty = profileService.requireFaculty(facultyEmail);

        return assignmentRepository.findByFaculty(faculty.getId())
                .stream()
                .map(this::toFacultyResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssignmentSubmissionResponse> submissions(String facultyEmail, Long assignmentId) {

        Faculty faculty = profileService.requireFaculty(facultyEmail);
        requireOwnAssignment(faculty, assignmentId);

        return submissionRepository.findByAssignmentIdOrderBySubmittedAtAsc(assignmentId)
                .stream()
                .map(this::toSubmissionResponse)
                .toList();
    }

    @Transactional
    public AssignmentSubmissionResponse grade(
            String facultyEmail, Long submissionId, GradeSubmissionRequest request) {

        Faculty faculty = profileService.requireFaculty(facultyEmail);

        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> NotFoundException.of("Submission", submissionId));

        requireOwnAssignment(faculty, submission.getAssignment().getId());

        BigDecimal maxMarks = submission.getAssignment().getMaxMarks();
        if (request.getMarksObtained().compareTo(maxMarks) > 0) {
            throw new BadRequestException("Marks cannot exceed the maximum of " + maxMarks);
        }

        submission.setMarksObtained(request.getMarksObtained());
        submission.setFeedback(request.getFeedback());
        submission.setStatus(SubmissionStatus.GRADED);
        submission.setGradedAt(LocalDateTime.now());
        submission.setGradedBy(facultyEmail);

        return toSubmissionResponse(submissionRepository.save(submission));
    }

    @Transactional(readOnly = true)
    public FileDownload submissionFileForFaculty(String facultyEmail, Long submissionId) {

        Faculty faculty = profileService.requireFaculty(facultyEmail);

        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> NotFoundException.of("Submission", submissionId));

        requireOwnAssignment(faculty, submission.getAssignment().getId());

        return toDownload(submission);
    }

    // ---------------------------------------------------------------- student

    @Transactional(readOnly = true)
    public List<AssignmentResponse> studentAssignments(String studentEmail) {

        Student student = profileService.requireStudent(studentEmail);
        requireClassDetails(student);

        return assignmentRepository.findForClass(
                        student.getCourse().getId(),
                        student.getSemester(),
                        student.getSection())
                .stream()
                .map(assignment -> toStudentResponse(assignment, student))
                .toList();
    }

    @Transactional
    public AssignmentSubmissionResponse submit(
            String studentEmail, Long assignmentId, MultipartFile file, String remarks) {

        Student student = profileService.requireStudent(studentEmail);

        Assignment assignment = assignmentRepository.findByIdAndActiveTrue(assignmentId)
                .orElseThrow(() -> NotFoundException.of("Assignment", assignmentId));

        if (!isForStudent(assignment, student)) {
            throw new ForbiddenException("This assignment was not set for your class");
        }

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Attach the file you want to submit");
        }

        FileStorageService.StoredFile stored =
                fileStorageService.save(file, "assignments/" + assignmentId);

        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElseGet(AssignmentSubmission::new);

        if (submission.getStatus() == SubmissionStatus.GRADED) {
            throw new BadRequestException(
                    "This submission has already been graded and cannot be replaced");
        }

        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setFilePath(stored.path());
        submission.setFileName(stored.originalName());
        submission.setContentType(file.getContentType());
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setRemarks(remarks);
        submission.setStatus(LocalDate.now().isAfter(assignment.getDueDate())
                ? SubmissionStatus.LATE
                : SubmissionStatus.SUBMITTED);

        return toSubmissionResponse(submissionRepository.save(submission));
    }

    @Transactional(readOnly = true)
    public FileDownload submissionFileForStudent(String studentEmail, Long submissionId) {

        Student student = profileService.requireStudent(studentEmail);

        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> NotFoundException.of("Submission", submissionId));

        if (!submission.getStudent().getId().equals(student.getId())) {
            throw new ForbiddenException("You can only download your own submission");
        }

        return toDownload(submission);
    }

    // ---------------------------------------------------------------- helpers

    private FacultySubject requireOwnAllocation(Faculty faculty, Long facultySubjectId) {

        FacultySubject allocation = facultySubjectRepository.findByIdAndActiveTrue(facultySubjectId)
                .orElseThrow(() -> NotFoundException.of("Subject allocation", facultySubjectId));

        if (!allocation.getFaculty().getId().equals(faculty.getId())) {
            throw new ForbiddenException("That subject is not allocated to you");
        }

        return allocation;
    }

    private Assignment requireOwnAssignment(Faculty faculty, Long assignmentId) {

        Assignment assignment = assignmentRepository.findByIdAndActiveTrue(assignmentId)
                .orElseThrow(() -> NotFoundException.of("Assignment", assignmentId));

        if (!assignment.getFacultySubject().getFaculty().getId().equals(faculty.getId())) {
            throw new ForbiddenException("You can only manage your own assignments");
        }

        return assignment;
    }

    private void requireClassDetails(Student student) {
        if (student.getCourse() == null || student.getSemester() == null
                || student.getSection() == null || student.getSection().isBlank()) {
            throw new BadRequestException(
                    "Your course, semester and section must be set before assignments can be listed");
        }
    }

    private boolean isForStudent(Assignment assignment, Student student) {

        if (student.getCourse() == null || student.getSemester() == null
                || student.getSection() == null) {
            return false;
        }

        Subject subject = assignment.getFacultySubject().getSubject();

        return subject.getCourse().getId().equals(student.getCourse().getId())
                && subject.getSemester().equals(student.getSemester())
                && assignment.getFacultySubject().getSection() != null
                && assignment.getFacultySubject().getSection().equalsIgnoreCase(student.getSection());
    }

    private FileDownload toDownload(AssignmentSubmission submission) {

        // Resolving up front means a missing file fails clearly instead of mid-stream.
        return new FileDownload(
                fileStorageService.load(submission.getFilePath()),
                submission.getFileName(),
                submission.getContentType());
    }

    private AssignmentResponse toFacultyResponse(Assignment assignment) {

        return baseResponse(assignment)
                .submissionCount(submissionRepository.countByAssignmentId(assignment.getId()))
                .gradedCount(submissionRepository.countByAssignmentIdAndStatus(
                        assignment.getId(), SubmissionStatus.GRADED))
                .build();
    }

    private AssignmentResponse toStudentResponse(Assignment assignment, Student student) {

        Optional<AssignmentSubmission> mine = submissionRepository
                .findByAssignmentIdAndStudentId(assignment.getId(), student.getId());

        return baseResponse(assignment)
                .mySubmission(mine.map(this::toSubmissionResponse).orElse(null))
                .build();
    }

    private AssignmentResponse.AssignmentResponseBuilder baseResponse(Assignment assignment) {

        FacultySubject allocation = assignment.getFacultySubject();
        Subject subject = allocation.getSubject();
        Faculty faculty = allocation.getFaculty();

        return AssignmentResponse.builder()
                .id(assignment.getId())
                .facultySubjectId(allocation.getId())
                .subjectId(subject.getId())
                .subjectCode(subject.getSubjectCode())
                .subjectName(subject.getSubjectName())
                .semester(subject.getSemester())
                .section(allocation.getSection())
                .academicYear(allocation.getAcademicYear())
                .facultyName(fullName(faculty.getFirstName(), faculty.getLastName()))
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .dueDate(assignment.getDueDate())
                .maxMarks(assignment.getMaxMarks())
                .attachmentName(assignment.getAttachmentName())
                .overdue(LocalDate.now().isAfter(assignment.getDueDate()))
                .createdAt(assignment.getCreatedAt());
    }

    private AssignmentSubmissionResponse toSubmissionResponse(AssignmentSubmission submission) {

        Student student = submission.getStudent();

        return AssignmentSubmissionResponse.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignment().getId())
                .assignmentTitle(submission.getAssignment().getTitle())
                .studentId(student.getId())
                .enrollmentNumber(student.getEnrollmentNumber())
                .studentName(fullName(student.getFirstName(), student.getLastName()))
                .fileName(submission.getFileName())
                .submittedAt(submission.getSubmittedAt())
                .remarks(submission.getRemarks())
                .status(submission.getStatus())
                .marksObtained(submission.getMarksObtained())
                .maxMarks(submission.getAssignment().getMaxMarks())
                .feedback(submission.getFeedback())
                .gradedAt(submission.getGradedAt())
                .gradedBy(submission.getGradedBy())
                .build();
    }

    private String fullName(String first, String last) {
        return last == null || last.isBlank() ? first : first + " " + last;
    }
}
