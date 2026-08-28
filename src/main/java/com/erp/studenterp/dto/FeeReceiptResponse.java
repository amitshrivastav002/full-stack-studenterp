package com.erp.studenterp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeeReceiptResponse {

    private String receiptNumber;

    private String transactionId;

    private Long studentId;

    private String enrollmentNumber;

    private String studentName;

    private String courseName;

    private Integer semester;

    private String feeType;

    private BigDecimal paymentAmount;

    private BigDecimal totalFee;

    private BigDecimal paidAmount;

    private BigDecimal dueAmount;

    private String paymentMethod;

    private LocalDateTime paymentDate;

    private String remarks;
}