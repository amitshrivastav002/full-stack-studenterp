package com.erp.studenterp.dto;

import lombok.*;
import java.time.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TimetableResponse {
    private Long id; private Long courseId; private String courseName; private Integer semester; private String section;
    private DayOfWeek day; private LocalTime startTime; private LocalTime endTime;
    private Long subjectId; private String subjectCode; private String subjectName;
    private Long facultyId; private String facultyName; private String room; private String academicYear;
}
