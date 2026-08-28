package com.erp.studenterp.repository;

import com.erp.studenterp.entity.Assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    Optional<Assignment> findByIdAndActiveTrue(Long id);

    List<Assignment> findByFacultySubjectIdAndActiveTrueOrderByDueDateDesc(Long facultySubjectId);

    @Query("""
            SELECT a
            FROM Assignment a
            WHERE a.active = true
              AND a.facultySubject.faculty.id = :facultyId
            ORDER BY a.dueDate DESC, a.id DESC
            """)
    List<Assignment> findByFaculty(@Param("facultyId") Long facultyId);

    /**
     * Everything set for the class a student sits in: same course and semester as the
     * subject, and the same section as the allocation.
     */
    @Query("""
            SELECT a
            FROM Assignment a
            WHERE a.active = true
              AND a.facultySubject.active = true
              AND a.facultySubject.subject.course.id = :courseId
              AND a.facultySubject.subject.semester = :semester
              AND LOWER(a.facultySubject.section) = LOWER(:section)
            ORDER BY a.dueDate DESC, a.id DESC
            """)
    List<Assignment> findForClass(
            @Param("courseId") Long courseId,
            @Param("semester") Integer semester,
            @Param("section") String section);
}
