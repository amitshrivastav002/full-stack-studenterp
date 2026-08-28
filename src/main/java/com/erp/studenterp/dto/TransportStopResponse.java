package com.erp.studenterp.dto;

import lombok.*;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransportStopResponse {

    private Long id;

    private Long routeId;

    private String stopName;

    private LocalTime pickupTime;

    private LocalTime dropTime;
}
