package com.erp.studenterp.controller;

import com.erp.studenterp.dto.StudentAttendanceSummary;
import com.erp.studenterp.entity.Student;
import com.erp.studenterp.exception.ForbiddenException;
import com.erp.studenterp.service.AttendanceService;
import com.erp.studenterp.service.ProfileService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/attendance")
@RequiredArgsConstructor
public class StudentAttendanceController {

    private final AttendanceService attendanceService;

    private final ProfileService profileService;


    /**
     * The id in the path is the caller's own. It is checked against the token
     * rather than trusted: every other student endpoint resolves the signed-in
     * student from their email, and without this check any student could read
     * another's record by editing the URL.
     */
    @GetMapping("/{studentId}")
    public List<StudentAttendanceSummary>
    getAttendance(
            @PathVariable Long studentId,
            Authentication authentication) {

        Student caller =
                profileService.requireStudent(
                        authentication.getName()
                );

        if (!caller.getId().equals(studentId)) {

            throw new ForbiddenException(
                    "You may only view your own attendance"
            );
        }

        return attendanceService
                .getStudentAttendanceSummary(
                        studentId
                );
    }
}
