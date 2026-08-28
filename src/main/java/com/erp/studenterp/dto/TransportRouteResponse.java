package com.erp.studenterp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransportRouteResponse {

    private Long id;

    private String routeCode;

    private String routeName;

    private String vehicleNumber;

    private String driverName;

    private String driverMobile;

    private Integer capacity;

    private Integer occupied;

    private Integer available;

    private BigDecimal farePerYear;

    private boolean active;

    private List<TransportStopResponse> stops;
}
