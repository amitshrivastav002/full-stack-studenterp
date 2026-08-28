package com.erp.studenterp.controller;

import com.erp.studenterp.dto.SubjectRequest;
import com.erp.studenterp.dto.SubjectResponse;
import com.erp.studenterp.service.SubjectService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;


    @PostMapping
    public SubjectResponse createSubject(
            @Valid
            @RequestBody SubjectRequest request) {

        return subjectService.createSubject(request);
    }


    @GetMapping("/{id}")
    public SubjectResponse getSubject(
            @PathVariable Long id) {

        return subjectService.getSubjectById(id);
    }


    @GetMapping
    public List<SubjectResponse> getSubjects(

            @RequestParam Long courseId,

            @RequestParam Integer semester) {

        return subjectService.getSubjects(
                courseId,
                semester
        );
    }


    @PutMapping("/{id}")
    public SubjectResponse updateSubject(

            @PathVariable Long id,

            @Valid
            @RequestBody SubjectRequest request) {

        return subjectService.updateSubject(
                id,
                request
        );
    }


    @DeleteMapping("/{id}")
    public String deleteSubject(
            @PathVariable Long id) {

        subjectService.deleteSubject(id);

        return "Subject deleted successfully";
    }
}