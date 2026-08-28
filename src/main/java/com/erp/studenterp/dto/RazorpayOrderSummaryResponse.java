package com.erp.studenterp.dto;

import com.erp.studenterp.entity.FeeType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One Razorpay order as the administration office sees it.  Distinct from
 * {@link RazorpayOrderResponse}, which is the checkout payload handed to a
 * browser and deliberately carries the public key.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayOrderSummaryResponse {

    private Long id;

    private String razorpayOrderId;

    private BigDecimal amount;

    /** False means the order was opened but never settled — usually abandoned. */
    private boolean completed;

    private LocalDateTime createdAt;

    private Long studentFeeId;

    private Long studentId;

    private String enrollmentNumber;

    private String studentName;

    private FeeType feeType;

    private String academicYear;
}
