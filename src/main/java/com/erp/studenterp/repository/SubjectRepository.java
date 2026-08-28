package com.erp.studenterp.repository;

import com.erp.studenterp.entity.Subject;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository
        extends JpaRepository<Subject, Long> {

    Optional<Subject> findByIdAndActiveTrue(Long id);

    boolean existsBySubjectCode(String subjectCode);

    boolean existsBySubjectCodeAndIdNot(
            String subjectCode,
            Long id
    );

    List<Subject> findBySemesterAndActiveTrue(
            Integer semester
    );

    List<Subject> findByCourseIdAndSemesterAndActiveTrue(
            Long courseId,
            Integer semester
    );

    long countByActiveTrue();
}
