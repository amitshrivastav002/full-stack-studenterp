package com.erp.studenterp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalTime;

@Data
public class TransportStopRequest {

    @NotBlank(message = "Stop name is required")
    private String stopName;

    private LocalTime pickupTime;

    private LocalTime dropTime;
}
