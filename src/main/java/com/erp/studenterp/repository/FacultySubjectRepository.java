package com.erp.studenterp.repository;

import com.erp.studenterp.entity.FacultySubject;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FacultySubjectRepository
        extends JpaRepository<FacultySubject, Long> {

    boolean existsByFacultyIdAndSubjectIdAndAcademicYearAndSectionAndActiveTrue(
            Long facultyId,
            Long subjectId,
            String academicYear,
            String section
    );

    List<FacultySubject> findByFacultyIdAndActiveTrue(
            Long facultyId
    );

    Optional<FacultySubject> findByIdAndActiveTrue(
            Long id
    );

    /** Every live allocation, for the administration office's own screens. */
    List<FacultySubject> findByActiveTrueOrderBySubjectSubjectCodeAsc();
}
