package com.erp.studenterp.dto;

import com.erp.studenterp.entity.AttendanceStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AttendanceItemRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Attendance status is required")
    private AttendanceStatus status;

    private String remarks;
}