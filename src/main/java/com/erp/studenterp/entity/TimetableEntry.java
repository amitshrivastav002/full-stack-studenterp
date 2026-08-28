package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(name = "timetable_entries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TimetableEntry extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    @Column(nullable = false) private Integer semester;
    @Column(nullable = false) private String section;
    // "day" is a reserved word in some databases, so the name is quoted. On
    // PostgreSQL this resolves to the same lower-case column as before.
    @Enumerated(EnumType.STRING) @Column(name = "\"day\"", nullable = false) private DayOfWeek day;
    @Column(name = "start_time", nullable = false) private LocalTime startTime;
    @Column(name = "end_time", nullable = false) private LocalTime endTime;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;
    @Column(nullable = false) private String room;
    @Column(name = "academic_year", nullable = false) private String academicYear;
    @Column(nullable = false) private boolean active = true;
}
