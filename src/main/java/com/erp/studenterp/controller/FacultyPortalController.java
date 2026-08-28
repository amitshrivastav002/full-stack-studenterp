package com.erp.studenterp.controller;

import com.erp.studenterp.dto.FacultyResponse;
import com.erp.studenterp.dto.FacultySubjectResponse;
import com.erp.studenterp.service.FacultyService;
import com.erp.studenterp.service.FacultySubjectService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty")
@RequiredArgsConstructor
public class FacultyPortalController {

    private final FacultyService facultyService;

    private final FacultySubjectService facultySubjectService;

    @GetMapping("/me")
    public FacultyResponse getMyProfile(
            Authentication authentication) {

        String email = authentication.getName();

        return facultyService.getFacultyByEmail(email);
    }


    // Subject assignments of the logged in faculty

    @GetMapping("/subjects")
    public List<FacultySubjectResponse> getMySubjects(
            Authentication authentication) {

        return facultySubjectService
                .getMySubjects(
                        authentication.getName()
                );
    }
}
