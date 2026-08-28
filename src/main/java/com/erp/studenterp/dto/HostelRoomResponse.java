package com.erp.studenterp.dto;

import com.erp.studenterp.entity.RoomType;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostelRoomResponse {

    private Long id;

    private String blockName;

    private String roomNumber;

    private RoomType roomType;

    private Integer capacity;

    private Integer occupied;

    private Integer available;

    private BigDecimal feePerYear;

    private boolean active;
}
