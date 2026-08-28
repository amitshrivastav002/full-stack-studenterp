package com.erp.studenterp.service;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.*;
import com.erp.studenterp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class StudentLeaveService {
    private final StudentLeaveRepository leaveRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final FacultySubjectRepository facultySubjectRepository;

    @Transactional
    public StudentLeaveResponse apply(String email, StudentLeaveRequest request) {
        Student student = getStudent(email);
        if (request.getToDate().isBefore(request.getFromDate())) throw new RuntimeException("To date cannot be before from date");
        StudentLeave leave = leaveRepository.save(StudentLeave.builder().student(student).fromDate(request.getFromDate()).toDate(request.getToDate()).reason(request.getReason().trim()).status(LeaveStatus.PENDING).build());
        return toResponse(leave);
    }
    @Transactional(readOnly = true)
    public List<StudentLeaveResponse> myLeaves(String email) { return leaveRepository.findByStudentIdOrderByCreatedAtDesc(getStudent(email).getId()).stream().map(this::toResponse).toList(); }
    @Transactional(readOnly = true)
    public List<StudentLeaveResponse> adminLeaves(LeaveStatus status) { return (status == null ? leaveRepository.findAllByOrderByCreatedAtDesc() : leaveRepository.findByStatusOrderByCreatedAtDesc(status)).stream().map(this::toResponse).toList(); }
    @Transactional(readOnly = true)
    public List<StudentLeaveResponse> facultyLeaves(String email, LeaveStatus status) {
        Faculty faculty = facultyRepository.findByUserEmail(email).orElseThrow(() -> new RuntimeException("Faculty profile not found"));
        List<FacultySubject> assignments = facultySubjectRepository.findByFacultyIdAndActiveTrue(faculty.getId());
        List<StudentLeave> leaves = status == null ? leaveRepository.findAllByOrderByCreatedAtDesc() : leaveRepository.findByStatusOrderByCreatedAtDesc(status);
        return leaves.stream().filter(leave -> assignments.stream().anyMatch(a -> teaches(a, leave.getStudent()))).map(this::toResponse).toList();
    }
    /**
     * Whether an allocation covers the class a student sits in. A student who
     * has not been placed on a course, semester and section yet is taught by
     * nobody, which is not the same thing as an error: returning false keeps
     * one incomplete record from breaking the whole leave list.
     */
    private boolean teaches(FacultySubject assignment, Student student) {
        if (student.getCourse() == null || student.getSemester() == null
                || student.getSection() == null) {
            return false;
        }

        return assignment.getSubject().getCourse().getId().equals(student.getCourse().getId())
                && assignment.getSubject().getSemester().equals(student.getSemester())
                && assignment.getSection() != null
                && assignment.getSection().equalsIgnoreCase(student.getSection());
    }

    @Transactional
    public StudentLeaveResponse decide(Long leaveId, String reviewerEmail, LeaveDecisionRequest request) {
        if (request.getStatus() == LeaveStatus.PENDING) throw new RuntimeException("Leave decision must be APPROVED or REJECTED");
        StudentLeave leave = leaveRepository.findById(leaveId).orElseThrow(() -> new RuntimeException("Leave request not found"));
        if (leave.getStatus() != LeaveStatus.PENDING) throw new RuntimeException("Leave request has already been decided");
        leave.setStatus(request.getStatus()); leave.setReviewerEmail(reviewerEmail); leave.setReviewerComment(request.getReviewerComment()); leave.setReviewedAt(LocalDateTime.now());
        return toResponse(leaveRepository.save(leave));
    }
    @Transactional
    public StudentLeaveResponse decideAsFaculty(Long leaveId, String reviewerEmail, LeaveDecisionRequest request) {
        Faculty faculty = facultyRepository.findByUserEmail(reviewerEmail).orElseThrow(() -> new RuntimeException("Faculty profile not found"));
        StudentLeave leave = leaveRepository.findById(leaveId).orElseThrow(() -> new RuntimeException("Leave request not found"));
        boolean canReview = facultySubjectRepository.findByFacultyIdAndActiveTrue(faculty.getId()).stream().anyMatch(a -> teaches(a, leave.getStudent()));
        if (!canReview) throw new RuntimeException("You are not assigned to this student's class");
        return decide(leaveId, reviewerEmail, request);
    }
    private Student getStudent(String email) { return studentRepository.findByEmailAndActiveTrue(email).orElseThrow(() -> new RuntimeException("Student profile not found")); }
    private StudentLeaveResponse toResponse(StudentLeave l) { Student s=l.getStudent(); return StudentLeaveResponse.builder().id(l.getId()).studentId(s.getId()).enrollmentNumber(s.getEnrollmentNumber()).studentName(s.getFirstName()+(s.getLastName()==null?"":" "+s.getLastName())).fromDate(l.getFromDate()).toDate(l.getToDate()).reason(l.getReason()).status(l.getStatus()).reviewerEmail(l.getReviewerEmail()).reviewedAt(l.getReviewedAt()).reviewerComment(l.getReviewerComment()).appliedAt(l.getCreatedAt()).build(); }
}
