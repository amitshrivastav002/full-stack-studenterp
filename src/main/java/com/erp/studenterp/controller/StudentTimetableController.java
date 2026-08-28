package com.erp.studenterp.controller;

import com.erp.studenterp.dto.TimetableResponse;
import com.erp.studenterp.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/student/timetable") @RequiredArgsConstructor
public class StudentTimetableController {
    private final TimetableService timetableService;
    @GetMapping public List<TimetableResponse> get(Authentication authentication, @RequestParam String academicYear) { return timetableService.getStudentTimetable(authentication.getName(), academicYear); }
}
