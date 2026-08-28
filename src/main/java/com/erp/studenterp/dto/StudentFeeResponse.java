package com.erp.studenterp.dto;

import com.erp.studenterp.entity.FeeType;
import com.erp.studenterp.entity.PaymentStatus;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentFeeResponse {

    private Long id;

    private Long studentId;

    private String enrollmentNumber;

    private String studentName;

    private Long feeStructureId;

    private FeeType feeType;

    private String academicYear;

    private BigDecimal totalAmount;

    private BigDecimal paidAmount;

    private BigDecimal dueAmount;

    private PaymentStatus status;
}