package com.erp.studenterp.repository;

import com.erp.studenterp.entity.TransportAssignment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransportAssignmentRepository extends JpaRepository<TransportAssignment, Long> {

    List<TransportAssignment> findAllByOrderByAssignedOnDescIdDesc();

    List<TransportAssignment> findByActiveTrueOrderByAssignedOnDescIdDesc();

    Optional<TransportAssignment> findByStudentIdAndActiveTrue(Long studentId);

    List<TransportAssignment> findByStudentIdOrderByAssignedOnDesc(Long studentId);

    long countByActiveTrue();
}
