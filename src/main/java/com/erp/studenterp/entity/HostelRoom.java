package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "hostel_rooms",
        uniqueConstraints = { @UniqueConstraint(columnNames = {"block_name", "room_number"}) }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HostelRoom extends BaseEntity {

    @Column(name = "block_name", nullable = false)
    private String blockName;

    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false)
    private RoomType roomType;

    @Column(nullable = false)
    private Integer capacity;

    /** Kept in step with allocations so a room is never over-filled. */
    @Column(nullable = false)
    @Builder.Default
    private Integer occupied = 0;

    @Column(name = "fee_per_year", precision = 10, scale = 2)
    private BigDecimal feePerYear;

    @Builder.Default
    private boolean active = true;
}
