package com.erp.studenterp.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class RazorpayOrderRequest {
    @NotNull private Long studentFeeId;
    @NotNull @DecimalMin(value = "0.01") private BigDecimal amount;
}
