package com.erp.studenterp.controller;

import com.erp.studenterp.dto.AttendanceRequest;
import com.erp.studenterp.dto.AttendanceResponse;
import com.erp.studenterp.dto.AttendanceStudentResponse;

import com.erp.studenterp.service.AttendanceService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/faculty/attendance")
@RequiredArgsConstructor
public class FacultyAttendanceController {

    private final AttendanceService attendanceService;


    @GetMapping(
            "/assignments/{assignmentId}/students"
    )
    public List<AttendanceStudentResponse>
    getStudents(

            @PathVariable Long assignmentId,

            Authentication authentication) {

        return attendanceService
                .getStudentsForAttendance(
                        authentication.getName(),
                        assignmentId
                );
    }


    @PostMapping
    public List<AttendanceResponse>
    markAttendance(

            @Valid
            @RequestBody AttendanceRequest request,

            Authentication authentication) {

        return attendanceService
                .markAttendance(
                        authentication.getName(),
                        request
                );
    }


    @GetMapping(
            "/assignments/{assignmentId}"
    )
    public List<AttendanceResponse>
    getAttendance(

            @PathVariable Long assignmentId,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate date,

            Authentication authentication) {

        return attendanceService
                .getAttendance(
                        authentication.getName(),
                        assignmentId,
                        date
                );
    }
}