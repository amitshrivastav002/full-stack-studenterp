package com.erp.studenterp.controller;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.service.AssignmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/assignments")
@RequiredArgsConstructor
public class FacultyAssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssignmentResponse create(
            Authentication authentication,
            @Valid @RequestBody AssignmentRequest request) {

        return assignmentService.create(authentication.getName(), request);
    }

    @GetMapping
    public List<AssignmentResponse> list(Authentication authentication) {
        return assignmentService.facultyAssignments(authentication.getName());
    }

    @PutMapping("/{assignmentId}")
    public AssignmentResponse update(
            Authentication authentication,
            @PathVariable Long assignmentId,
            @Valid @RequestBody AssignmentRequest request) {

        return assignmentService.update(authentication.getName(), assignmentId, request);
    }

    @DeleteMapping("/{assignmentId}")
    public MessageResponse delete(
            Authentication authentication,
            @PathVariable Long assignmentId) {

        assignmentService.delete(authentication.getName(), assignmentId);
        return MessageResponse.of("Assignment removed successfully");
    }

    @GetMapping("/{assignmentId}/submissions")
    public List<AssignmentSubmissionResponse> submissions(
            Authentication authentication,
            @PathVariable Long assignmentId) {

        return assignmentService.submissions(authentication.getName(), assignmentId);
    }

    @PutMapping("/submissions/{submissionId}/grade")
    public AssignmentSubmissionResponse grade(
            Authentication authentication,
            @PathVariable Long submissionId,
            @Valid @RequestBody GradeSubmissionRequest request) {

        return assignmentService.grade(authentication.getName(), submissionId, request);
    }

    @GetMapping("/submissions/{submissionId}/file")
    public ResponseEntity<Resource> download(
            Authentication authentication,
            @PathVariable Long submissionId) {

        return Downloads.attachment(
                assignmentService.submissionFileForFaculty(authentication.getName(), submissionId));
    }
}
