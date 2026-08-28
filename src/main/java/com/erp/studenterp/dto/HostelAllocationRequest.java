package com.erp.studenterp.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class HostelAllocationRequest {

    @NotNull(message = "Select a student")
    private Long studentId;

    @NotNull(message = "Select a room")
    private Long roomId;

    @Size(max = 500, message = "Remarks cannot exceed 500 characters")
    private String remarks;
}
