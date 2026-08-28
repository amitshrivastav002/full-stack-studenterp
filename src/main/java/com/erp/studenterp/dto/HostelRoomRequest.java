package com.erp.studenterp.dto;

import com.erp.studenterp.entity.RoomType;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class HostelRoomRequest {

    @NotBlank(message = "Block name is required")
    private String blockName;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotNull(message = "Room type is required")
    private RoomType roomType;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @DecimalMin(value = "0.0", message = "Fee cannot be negative")
    private BigDecimal feePerYear;
}
