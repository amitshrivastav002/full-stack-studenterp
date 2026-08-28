package com.erp.studenterp.dto;

import com.erp.studenterp.entity.FeeType;

import jakarta.validation.constraints.*;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class FeeStructureRequest {

    @NotNull
    private Long courseId;

    @NotNull
    @Min(1)
    private Integer semester;

    @NotNull
    private FeeType feeType;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal amount;

    @NotBlank
    private String academicYear;
}