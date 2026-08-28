package com.erp.studenterp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class StudentMarkRequest {
    @NotNull private Long studentId;
    @NotNull @DecimalMin("0.00") private BigDecimal marksObtained;
}
