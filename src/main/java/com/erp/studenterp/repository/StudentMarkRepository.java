package com.erp.studenterp.repository;

import com.erp.studenterp.entity.StudentMark;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StudentMarkRepository extends JpaRepository<StudentMark, Long> {
    Optional<StudentMark> findByStudentIdAndExamSubjectId(Long studentId, Long examSubjectId);
    List<StudentMark> findByExamSubjectExamId(Long examId);
    List<StudentMark> findByStudentIdAndExamSubjectExamId(Long studentId, Long examId);
}
