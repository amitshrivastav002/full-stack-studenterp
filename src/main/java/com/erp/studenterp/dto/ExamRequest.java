package com.erp.studenterp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ExamRequest {
    @NotBlank private String examName;
    @NotNull private LocalDate examDate;
    @NotNull @Min(1) @Max(8) private Integer semester;
    @NotBlank private String academicYear;
    @NotNull private Long courseId;
}
