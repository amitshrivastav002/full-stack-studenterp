package com.erp.studenterp.repository;
import com.erp.studenterp.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface StudentLeaveRepository extends JpaRepository<StudentLeave, Long> {
    List<StudentLeave> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<StudentLeave> findByStatusOrderByCreatedAtDesc(LeaveStatus status);
    List<StudentLeave> findAllByOrderByCreatedAtDesc();

    long countByStatus(LeaveStatus status);

    long countByStudentIdAndStatus(Long studentId, LeaveStatus status);
}
