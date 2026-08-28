package com.erp.studenterp.dto;

import com.erp.studenterp.entity.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeePaymentResponse {

    private Long id;

    private Long studentFeeId;

    private Long studentId;

    private String enrollmentNumber;

    private String studentName;

    private String transactionId;

    private BigDecimal amount;

    private BigDecimal totalAmount;

    private BigDecimal paidAmount;

    private BigDecimal dueAmount;

    private String paymentMethod;

    private LocalDateTime paymentDate;

    private PaymentStatus status;

    private String remarks;
}