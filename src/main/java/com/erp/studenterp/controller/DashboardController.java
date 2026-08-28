package com.erp.studenterp.controller;

import com.erp.studenterp.dto.AdminDashboardResponse;
import com.erp.studenterp.dto.FacultyDashboardResponse;
import com.erp.studenterp.dto.StudentDashboardResponse;
import com.erp.studenterp.service.DashboardService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * One controller for the three portal home pages. The paths keep their role prefix
 * so the existing security rules apply without any extra configuration.
 */
@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/api/admin/dashboard")
    public AdminDashboardResponse admin() {
        return dashboardService.admin();
    }

    @GetMapping("/api/faculty/dashboard")
    public FacultyDashboardResponse faculty(
            Authentication authentication,
            @RequestParam(required = false) String academicYear) {

        return dashboardService.faculty(authentication.getName(), academicYear);
    }

    @GetMapping("/api/student/dashboard")
    public StudentDashboardResponse student(
            Authentication authentication,
            @RequestParam(required = false) String academicYear) {

        return dashboardService.student(authentication.getName(), academicYear);
    }
}
