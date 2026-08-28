package com.erp.studenterp.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class GradeSubmissionRequest {

    @NotNull(message = "Marks are required")
    @DecimalMin(value = "0.0", message = "Marks cannot be negative")
    private BigDecimal marksObtained;

    @Size(max = 1000, message = "Feedback cannot exceed 1000 characters")
    private String feedback;
}
