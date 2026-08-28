package com.erp.studenterp.repository;

import com.erp.studenterp.entity.HostelAllocation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HostelAllocationRepository extends JpaRepository<HostelAllocation, Long> {

    List<HostelAllocation> findAllByOrderByAllocatedOnDescIdDesc();

    List<HostelAllocation> findByActiveTrueOrderByAllocatedOnDescIdDesc();

    Optional<HostelAllocation> findByStudentIdAndActiveTrue(Long studentId);

    List<HostelAllocation> findByStudentIdOrderByAllocatedOnDesc(Long studentId);

    long countByActiveTrue();

    long countByRoomIdAndActiveTrue(Long roomId);
}
