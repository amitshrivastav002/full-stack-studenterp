package com.erp.studenterp.repository;

import com.erp.studenterp.entity.FeeStructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeeStructureRepository
        extends JpaRepository<FeeStructure, Long> {

    List<FeeStructure>
    findByCourseIdAndSemesterAndAcademicYearAndActiveTrue(
            Long courseId,
            Integer semester,
            String academicYear
    );

    List<FeeStructure>
    findByCourseIdAndSemesterAndActiveTrue(
            Long courseId,
            Integer semester
    );

    Optional<FeeStructure>
    findByIdAndActiveTrue(Long id);
}
