package com.erp.studenterp.service;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.*;
import com.erp.studenterp.exception.BadRequestException;
import com.erp.studenterp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExamService {
    private final ExamRepository examRepository;
    private final ExamSubjectRepository examSubjectRepository;
    private final StudentMarkRepository studentMarkRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public ExamResponse createExam(ExamRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));
        Exam exam = examRepository.save(Exam.builder().examName(request.getExamName().trim())
                .examDate(request.getExamDate()).semester(request.getSemester())
                .academicYear(request.getAcademicYear().trim()).course(course).build());
        return toExamResponse(exam);
    }

    @Transactional(readOnly = true)
    public List<ExamResponse> getExams(Long courseId, Integer semester, String academicYear) {
        return examRepository.findByCourseIdAndSemesterAndAcademicYearOrderByExamDateDesc(
                courseId, semester, academicYear).stream().map(this::toExamResponse).toList();
    }

    @Transactional
    public ExamSubjectResponse addSubject(Long examId, ExamSubjectRequest request) {
        Exam exam = getExam(examId);
        Subject subject = subjectRepository.findByIdAndActiveTrue(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        if (!subject.getCourse().getId().equals(exam.getCourse().getId())
                || !subject.getSemester().equals(exam.getSemester())) {
            throw new RuntimeException("Subject does not belong to the exam course and semester");
        }
        if (request.getPassMarks().compareTo(request.getMaxMarks()) > 0) {
            throw new RuntimeException("Pass marks cannot be greater than maximum marks");
        }
        ExamSubject examSubject = examSubjectRepository.findByExamIdAndSubjectId(examId, subject.getId())
                .orElseGet(() -> ExamSubject.builder().exam(exam).subject(subject).build());
        examSubject.setMaxMarks(request.getMaxMarks());
        examSubject.setPassMarks(request.getPassMarks());
        return toExamSubjectResponse(examSubjectRepository.save(examSubject));
    }

    @Transactional(readOnly = true)
    public List<ExamSubjectResponse> getExamSubjects(Long examId) {
        getExam(examId);
        return examSubjectRepository.findByExamId(examId).stream().map(this::toExamSubjectResponse).toList();
    }

    @Transactional
    public StudentMarkResponse saveMark(Long examSubjectId, StudentMarkRequest request) {
        ExamSubject examSubject = examSubjectRepository.findById(examSubjectId)
                .orElseThrow(() -> new RuntimeException("Exam subject not found"));
        Student student = studentRepository.findByIdAndActiveTrue(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
        Exam exam = examSubject.getExam();
        if (student.getCourse() == null || student.getSemester() == null) {
            throw new BadRequestException(
                    "Set the student's course and semester before entering marks");
        }
        if (!student.getCourse().getId().equals(exam.getCourse().getId())
                || !student.getSemester().equals(exam.getSemester())) {
            throw new RuntimeException("Student does not belong to this exam course and semester");
        }
        if (request.getMarksObtained().compareTo(examSubject.getMaxMarks()) > 0) {
            throw new RuntimeException("Marks obtained cannot exceed maximum marks");
        }
        StudentMark mark = studentMarkRepository.findByStudentIdAndExamSubjectId(student.getId(), examSubjectId)
                .orElseGet(() -> StudentMark.builder().student(student).examSubject(examSubject).build());
        mark.setMarksObtained(request.getMarksObtained());
        return toMarkResponse(studentMarkRepository.save(mark));
    }

    @Transactional(readOnly = true)
    public List<StudentExamResultResponse> getExamResults(Long examId) {
        getExam(examId);
        return studentMarkRepository.findByExamSubjectExamId(examId).stream()
                .collect(java.util.stream.Collectors.groupingBy(mark -> mark.getStudent().getId()))
                .values().stream().map(this::toResult).toList();
    }

    @Transactional(readOnly = true)
    public StudentExamResultResponse getStudentResult(Long examId, Long studentId) {
        getExam(examId);
        List<StudentMark> marks = studentMarkRepository.findByStudentIdAndExamSubjectExamId(studentId, examId);
        if (marks.isEmpty()) throw new RuntimeException("Marks not found for this student and exam");
        return toResult(marks);
    }

    @Transactional(readOnly = true)
    public List<StudentExamResultResponse> getResultsForStudentEmail(String email) {
        Student student = studentRepository.findByEmailAndActiveTrue(email)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));
        Map<Long, List<StudentMark>> grouped = studentMarkRepository
                .findAll().stream().filter(mark -> mark.getStudent().getId().equals(student.getId()))
                .collect(java.util.stream.Collectors.groupingBy(mark -> mark.getExamSubject().getExam().getId()));
        return grouped.values().stream().map(this::toResult).toList();
    }

    private StudentExamResultResponse toResult(List<StudentMark> marks) {
        Student student = marks.get(0).getStudent(); Exam exam = marks.get(0).getExamSubject().getExam();
        BigDecimal total = marks.stream().map(mark -> mark.getExamSubject().getMaxMarks()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal obtained = marks.stream().map(StudentMark::getMarksObtained).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal percentage = total.signum() == 0 ? BigDecimal.ZERO : obtained.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
        boolean passed = marks.stream().allMatch(mark -> mark.getMarksObtained().compareTo(mark.getExamSubject().getPassMarks()) >= 0);
        return StudentExamResultResponse.builder().examId(exam.getId()).examName(exam.getExamName())
                .academicYear(exam.getAcademicYear()).studentId(student.getId())
                .enrollmentNumber(student.getEnrollmentNumber()).studentName(name(student))
                .totalMarks(total).obtainedMarks(obtained).percentage(percentage).grade(grade(percentage))
                .result(passed ? "PASS" : "FAIL").marks(marks.stream().map(this::toMarkResponse).toList()).build();
    }

    private String grade(BigDecimal p) { if (p.compareTo(BigDecimal.valueOf(90)) >= 0) return "A+"; if (p.compareTo(BigDecimal.valueOf(80)) >= 0) return "A"; if (p.compareTo(BigDecimal.valueOf(70)) >= 0) return "B"; if (p.compareTo(BigDecimal.valueOf(60)) >= 0) return "C"; if (p.compareTo(BigDecimal.valueOf(50)) >= 0) return "D"; return "F"; }
    private Exam getExam(Long id) { return examRepository.findById(id).orElseThrow(() -> new RuntimeException("Exam not found")); }
    private String name(Student s) { return s.getFirstName() + (s.getLastName() == null || s.getLastName().isBlank() ? "" : " " + s.getLastName()); }
    private ExamResponse toExamResponse(Exam e) { return ExamResponse.builder().id(e.getId()).examName(e.getExamName()).examDate(e.getExamDate()).semester(e.getSemester()).academicYear(e.getAcademicYear()).courseId(e.getCourse().getId()).courseName(e.getCourse().getCourseName()).build(); }
    private ExamSubjectResponse toExamSubjectResponse(ExamSubject e) { return ExamSubjectResponse.builder().id(e.getId()).subjectId(e.getSubject().getId()).subjectCode(e.getSubject().getSubjectCode()).subjectName(e.getSubject().getSubjectName()).maxMarks(e.getMaxMarks()).passMarks(e.getPassMarks()).build(); }
    private StudentMarkResponse toMarkResponse(StudentMark m) { ExamSubject e = m.getExamSubject(); return StudentMarkResponse.builder().id(m.getId()).studentId(m.getStudent().getId()).enrollmentNumber(m.getStudent().getEnrollmentNumber()).studentName(name(m.getStudent())).examSubjectId(e.getId()).subjectName(e.getSubject().getSubjectName()).maxMarks(e.getMaxMarks()).passMarks(e.getPassMarks()).marksObtained(m.getMarksObtained()).passed(m.getMarksObtained().compareTo(e.getPassMarks()) >= 0).build(); }
}
