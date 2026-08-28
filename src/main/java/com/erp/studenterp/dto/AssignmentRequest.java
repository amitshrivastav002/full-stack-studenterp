package com.erp.studenterp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssignmentRequest {

    @NotNull(message = "Select the subject allocation this assignment belongs to")
    private Long facultySubjectId;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @Size(max = 4000, message = "Description cannot exceed 4000 characters")
    private String description;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    @NotNull(message = "Maximum marks is required")
    @DecimalMin(value = "1.0", message = "Maximum marks must be at least 1")
    @DecimalMax(value = "1000.0", message = "Maximum marks cannot exceed 1000")
    private BigDecimal maxMarks;
}
