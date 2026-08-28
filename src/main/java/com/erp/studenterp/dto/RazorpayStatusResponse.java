package com.erp.studenterp.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * Whether online payment is switched on, plus the totals the office needs to
 * reconcile.  Carries a masked key and never the secret.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayStatusResponse {

    /** False when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are unset. */
    private boolean configured;

    /** Last four characters only, so the screen can confirm which key is live. */
    private String keyIdHint;

    private long totalOrders;

    private long completedOrders;

    private long pendingOrders;

    private BigDecimal collectedAmount;

    private BigDecimal pendingAmount;
}
