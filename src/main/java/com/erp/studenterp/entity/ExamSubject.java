package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "exam_subjects", uniqueConstraints = @UniqueConstraint(
        name = "uk_exam_subject", columnNames = {"exam_id", "subject_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamSubject extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;
    @Column(name = "max_marks", nullable = false, precision = 7, scale = 2) private BigDecimal maxMarks;
    @Column(name = "pass_marks", nullable = false, precision = 7, scale = 2) private BigDecimal passMarks;
}
