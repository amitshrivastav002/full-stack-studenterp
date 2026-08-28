package com.erp.studenterp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * The student-facing counterpart of {@link RazorpayPaymentVerificationRequest}.
 * It carries no payment method: a checkout settlement is always recorded as
 * PaymentMethod.ONLINE, so the client cannot mislabel how the money arrived.
 */
@Data
public class StudentRazorpayVerificationRequest {
    @NotBlank private String razorpayOrderId;
    @NotBlank private String razorpayPaymentId;
    @NotBlank private String razorpaySignature;
    private String remarks;
}
