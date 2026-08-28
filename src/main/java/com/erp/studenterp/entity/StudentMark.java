package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "student_marks", uniqueConstraints = @UniqueConstraint(
        name = "uk_student_exam_subject", columnNames = {"student_id", "exam_subject_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentMark extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "student_id", nullable = false)
    private Student student;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "exam_subject_id", nullable = false)
    private ExamSubject examSubject;
    @Column(name = "marks_obtained", nullable = false, precision = 7, scale = 2)
    private BigDecimal marksObtained;
}
