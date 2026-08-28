package com.erp.studenterp.repository;

import com.erp.studenterp.entity.ExamSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExamSubjectRepository extends JpaRepository<ExamSubject, Long> {
    List<ExamSubject> findByExamId(Long examId);
    Optional<ExamSubject> findByExamIdAndSubjectId(Long examId, Long subjectId);
}
