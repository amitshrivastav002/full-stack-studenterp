package com.erp.studenterp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransportRouteRequest {

    @NotBlank(message = "Route code is required")
    private String routeCode;

    @NotBlank(message = "Route name is required")
    private String routeName;

    private String vehicleNumber;

    private String driverName;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "Driver mobile must be 10 digits")
    private String driverMobile;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @DecimalMin(value = "0.0", message = "Fare cannot be negative")
    private BigDecimal farePerYear;
}
