package com.erp.studenterp.repository;

import com.erp.studenterp.entity.Faculty;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FacultyRepository
        extends JpaRepository<Faculty, Long> {

    Optional<Faculty> findByIdAndActiveTrue(Long id);

    boolean existsByEmail(String email);

    boolean existsByEmployeeId(String employeeId);

    boolean existsByEmailAndIdNot(
            String email,
            Long id
    );

    boolean existsByEmployeeIdAndIdNot(
            String employeeId,
            Long id
    );

    Page<Faculty> findByActiveTrue(
            Pageable pageable
    );

    @Query("""
        SELECT f
        FROM Faculty f
        WHERE f.active = true
        AND (
            LOWER(f.firstName)
                LIKE LOWER(CONCAT('%', :keyword, '%'))

            OR LOWER(f.lastName)
                LIKE LOWER(CONCAT('%', :keyword, '%'))

            OR LOWER(f.email)
                LIKE LOWER(CONCAT('%', :keyword, '%'))

            OR LOWER(f.employeeId)
                LIKE LOWER(CONCAT('%', :keyword, '%'))

            OR LOWER(f.designation)
                LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
    """)
    List<Faculty> searchFaculty(
            @Param("keyword") String keyword
    );
    Optional<Faculty> findByUserEmail(String email);

    long countByActiveTrue();
}
