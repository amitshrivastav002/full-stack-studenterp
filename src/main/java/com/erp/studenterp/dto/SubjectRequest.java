package com.erp.studenterp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SubjectRequest {

    @NotBlank(message = "Subject code is required")
    private String subjectCode;

    @NotBlank(message = "Subject name is required")
    private String subjectName;

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be at least 1")
    @Max(value = 12, message = "Semester cannot exceed 12")
    private Integer semester;

    @Min(value = 1, message = "Credits must be at least 1")
    private Integer credits;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    @NotNull(message = "Course ID is required")
    private Long courseId;
}