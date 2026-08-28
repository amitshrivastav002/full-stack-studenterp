package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "faculty_subjects",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {
                                "faculty_id",
                                "subject_id"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FacultySubject extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "faculty_id",
            nullable = false
    )
    private Faculty faculty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "subject_id",
            nullable = false
    )
    private Subject subject;

    @Column(name = "academic_year")
    private String academicYear;

    private String section;

    private boolean active = true;
}