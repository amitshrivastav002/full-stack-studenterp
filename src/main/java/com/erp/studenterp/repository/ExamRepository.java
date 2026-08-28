package com.erp.studenterp.repository;

import com.erp.studenterp.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByCourseIdAndSemesterAndAcademicYearOrderByExamDateDesc(
            Long courseId, Integer semester, String academicYear);
}
