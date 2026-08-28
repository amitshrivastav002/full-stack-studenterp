package com.erp.studenterp.repository;

import com.erp.studenterp.entity.AssignmentSubmission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssignmentSubmissionRepository
        extends JpaRepository<AssignmentSubmission, Long> {

    Optional<AssignmentSubmission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    List<AssignmentSubmission> findByAssignmentIdOrderBySubmittedAtAsc(Long assignmentId);

    List<AssignmentSubmission> findByStudentIdOrderBySubmittedAtDesc(Long studentId);

    long countByAssignmentId(Long assignmentId);

    long countByAssignmentIdAndStatus(
            Long assignmentId,
            com.erp.studenterp.entity.SubmissionStatus status);
}
