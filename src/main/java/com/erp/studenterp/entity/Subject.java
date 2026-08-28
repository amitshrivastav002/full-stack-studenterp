package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "subjects",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {
                                "subject_code"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Subject extends BaseEntity {

    @Column(
            name = "subject_code",
            nullable = false,
            unique = true
    )
    private String subjectCode;

    @Column(
            name = "subject_name",
            nullable = false
    )
    private String subjectName;

    @Column(nullable = false)
    private Integer semester;

    private Integer credits;

    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "department_id",
            nullable = false
    )
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "course_id",
            nullable = false
    )
    private Course course;
}