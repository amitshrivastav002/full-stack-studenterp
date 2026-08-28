package com.erp.studenterp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TransportAssignmentRequest {

    @NotNull(message = "Select a student")
    private Long studentId;

    @NotNull(message = "Select a route")
    private Long routeId;

    private Long stopId;
}
