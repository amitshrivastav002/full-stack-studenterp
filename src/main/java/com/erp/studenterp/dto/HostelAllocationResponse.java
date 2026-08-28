package com.erp.studenterp.dto;

import com.erp.studenterp.entity.RoomType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostelAllocationResponse {

    private Long id;

    private Long studentId;

    private String enrollmentNumber;

    private String studentName;

    private Long roomId;

    private String blockName;

    private String roomNumber;

    private RoomType roomType;

    private BigDecimal feePerYear;

    private LocalDate allocatedOn;

    private LocalDate vacatedOn;

    private String remarks;

    private boolean active;
}
