package com.erp.studenterp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class AttendanceRequest {

    @NotNull(message = "Faculty subject assignment ID is required")
    private Long facultySubjectId;

    @NotNull(message = "Attendance date is required")
    private LocalDate attendanceDate;

    @NotEmpty(message = "Attendance list cannot be empty")
    @Valid
    private List<AttendanceItemRequest> students;
}