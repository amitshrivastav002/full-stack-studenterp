package com.erp.studenterp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.*;

@Data
public class TimetableRequest {
    @NotNull private Long courseId;
    @NotNull @Min(1) @Max(8) private Integer semester;
    @NotBlank private String section;
    @NotNull private DayOfWeek day;
    @NotNull private LocalTime startTime;
    @NotNull private LocalTime endTime;
    @NotNull private Long subjectId;
    @NotNull private Long facultyId;
    @NotBlank private String room;
    @NotBlank private String academicYear;
}
