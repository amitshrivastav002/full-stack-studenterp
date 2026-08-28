package com.erp.studenterp.dto;

import com.erp.studenterp.entity.FeeType;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeeStructureResponse {

    private Long id;

    private Long courseId;

    private String courseName;

    private Integer semester;

    private FeeType feeType;

    private BigDecimal amount;

    private String academicYear;

    private boolean active;
}