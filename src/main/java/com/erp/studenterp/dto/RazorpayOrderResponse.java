package com.erp.studenterp.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RazorpayOrderResponse {
    private String keyId;
    private String orderId;
    private Long amountInPaise;
    private String currency;
    private Long studentFeeId;
}
