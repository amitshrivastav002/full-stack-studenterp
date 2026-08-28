package com.erp.studenterp.controller;

import com.erp.studenterp.dto.FacultySubjectRequest;
import com.erp.studenterp.dto.FacultySubjectResponse;
import com.erp.studenterp.service.FacultySubjectService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/admin/faculty-subjects")
@RequiredArgsConstructor
public class FacultySubjectAdminController {

    private final FacultySubjectService facultySubjectService;
   

    // ASSIGN SUBJECT

    @PostMapping
    public FacultySubjectResponse assignSubject(
            @Valid
            @RequestBody FacultySubjectRequest request) {

        return facultySubjectService
                .assignSubject(request);
    }


    // GET SUBJECTS ASSIGNED TO A FACULTY

    @GetMapping("/faculty/{facultyId}")
    public List<FacultySubjectResponse>
    getFacultySubjects(
            @PathVariable Long facultyId) {

        return facultySubjectService
                .getFacultySubjects(facultyId);
    }


    // REMOVE ASSIGNMENT

    @DeleteMapping("/{assignmentId}")
    public String removeAssignment(
            @PathVariable Long assignmentId) {

        facultySubjectService
                .removeAssignment(assignmentId);

        return "Subject assignment removed successfully";
    }
}