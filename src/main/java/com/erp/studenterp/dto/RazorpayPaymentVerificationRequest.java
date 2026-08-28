package com.erp.studenterp.dto;

import com.erp.studenterp.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RazorpayPaymentVerificationRequest {
    @NotBlank private String razorpayOrderId;
    @NotBlank private String razorpayPaymentId;
    @NotBlank private String razorpaySignature;
    @NotNull private PaymentMethod paymentMethod;
    private String remarks;
}
