package com.erp.studenterp.repository;

import com.erp.studenterp.entity.Student;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository
        extends JpaRepository<Student, Long> {

    Optional<Student> findByIdAndActiveTrue(Long id);

    Optional<Student> findByEmailAndActiveTrue(String email);

    boolean existsByEmail(String email);

    boolean existsByEnrollmentNumber(
            String enrollmentNumber
    );

    Page<Student> findByActiveTrue(
            Pageable pageable
    );

    List<Student>
    findByCourseIdAndSemesterAndSectionIgnoreCaseAndActiveTrue(
            Long courseId,
            Integer semester,
            String section
    );

    List<Student>
    findByCourseIdAndSemesterAndActiveTrue(
            Long courseId,
            Integer semester
    );

    @Query("""
            SELECT s
            FROM Student s
            WHERE s.active = true
            AND (
                LOWER(s.firstName)
                    LIKE LOWER(CONCAT('%', :keyword, '%'))

                OR LOWER(s.lastName)
                    LIKE LOWER(CONCAT('%', :keyword, '%'))

                OR LOWER(s.email)
                    LIKE LOWER(CONCAT('%', :keyword, '%'))

                OR LOWER(s.enrollmentNumber)
                    LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            """)
    List<Student> searchStudents(
            @Param("keyword") String keyword
    );

    long countByActiveTrue();

    long countByCourseIdAndActiveTrue(Long courseId);
}
