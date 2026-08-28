package com.erp.studenterp.controller;

import com.erp.studenterp.dto.StudentExamResultResponse;
import com.erp.studenterp.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/student/exams")
@RequiredArgsConstructor
public class StudentExamController {
    private final ExamService examService;
    @GetMapping("/results")
    public List<StudentExamResultResponse> results(Authentication authentication) {
        return examService.getResultsForStudentEmail(authentication.getName());
    }
}
