package com.erp.studenterp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransportAssignmentResponse {

    private Long id;

    private Long studentId;

    private String enrollmentNumber;

    private String studentName;

    private Long routeId;

    private String routeCode;

    private String routeName;

    private String vehicleNumber;

    private String driverName;

    private String driverMobile;

    private Long stopId;

    private String stopName;

    private LocalTime pickupTime;

    private BigDecimal farePerYear;

    private LocalDate assignedOn;

    private LocalDate releasedOn;

    private boolean active;
}
