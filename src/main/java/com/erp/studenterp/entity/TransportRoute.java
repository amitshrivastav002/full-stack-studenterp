package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "transport_routes",
        uniqueConstraints = { @UniqueConstraint(columnNames = "route_code") }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportRoute extends BaseEntity {

    @Column(name = "route_code", nullable = false, unique = true)
    private String routeCode;

    @Column(name = "route_name", nullable = false)
    private String routeName;

    @Column(name = "vehicle_number")
    private String vehicleNumber;

    @Column(name = "driver_name")
    private String driverName;

    @Column(name = "driver_mobile")
    private String driverMobile;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    @Builder.Default
    private Integer occupied = 0;

    @Column(name = "fare_per_year", precision = 10, scale = 2)
    private BigDecimal farePerYear;

    @Builder.Default
    private boolean active = true;
}
