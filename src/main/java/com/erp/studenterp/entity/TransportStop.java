package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "transport_stops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportStop extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private TransportRoute route;

    @Column(name = "stop_name", nullable = false)
    private String stopName;

    @Column(name = "pickup_time")
    private LocalTime pickupTime;

    @Column(name = "drop_time")
    private LocalTime dropTime;

    @Builder.Default
    private boolean active = true;
}
