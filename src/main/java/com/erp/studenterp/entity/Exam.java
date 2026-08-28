package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "exams", uniqueConstraints = @UniqueConstraint(
        name = "uk_exam_course_name_semester_year",
        columnNames = {"course_id", "exam_name", "semester", "academic_year"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Exam extends BaseEntity {
    @Column(name = "exam_name", nullable = false) private String examName;
    @Column(name = "exam_date", nullable = false) private LocalDate examDate;
    @Column(nullable = false) private Integer semester;
    @Column(name = "academic_year", nullable = false) private String academicYear;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "course_id", nullable = false)
    private Course course;
}
