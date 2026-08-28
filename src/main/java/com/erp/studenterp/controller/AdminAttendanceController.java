package com.erp.studenterp.controller;

import com.erp.studenterp.dto.AttendanceRequest;
import com.erp.studenterp.dto.AttendanceResponse;
import com.erp.studenterp.dto.AttendanceStudentResponse;
import com.erp.studenterp.dto.FacultySubjectResponse;
import com.erp.studenterp.service.AttendanceService;
import com.erp.studenterp.service.FacultySubjectService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Lets the administration office mark attendance for any class, not just the
 * ones a signed-in faculty member teaches - for the days a lecturer is absent,
 * or a register has to be corrected after the fact.
 *
 * <p>Everything under /api/admin is already restricted to ADMIN by
 * {@link com.erp.studenterp.config.SecurityConfig}.
 */
@RestController
@RequestMapping("/api/admin/attendance")
@RequiredArgsConstructor
public class AdminAttendanceController {

    private final AttendanceService attendanceService;

    private final FacultySubjectService facultySubjectService;

    /** Every live faculty-subject allocation, to pick a class from. */
    @GetMapping("/assignments")
    public List<FacultySubjectResponse> assignments() {
        return facultySubjectService.getAllAssignments();
    }

    @GetMapping("/assignments/{assignmentId}/students")
    public List<AttendanceStudentResponse> students(
            @PathVariable Long assignmentId) {

        return attendanceService
                .getStudentsForAssignment(assignmentId);
    }

    @GetMapping("/assignments/{assignmentId}")
    public List<AttendanceResponse> attendance(
            @PathVariable Long assignmentId,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        return attendanceService
                .getAttendanceForAssignment(assignmentId, date);
    }

    @PostMapping
    public List<AttendanceResponse> markAttendance(
            @Valid @RequestBody AttendanceRequest request) {

        return attendanceService
                .markAttendanceForAssignment(request);
    }
}
