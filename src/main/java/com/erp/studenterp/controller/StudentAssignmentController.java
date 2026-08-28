package com.erp.studenterp.controller;

import com.erp.studenterp.dto.AssignmentResponse;
import com.erp.studenterp.dto.AssignmentSubmissionResponse;
import com.erp.studenterp.service.AssignmentService;

import lombok.RequiredArgsConstructor;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/student/assignments")
@RequiredArgsConstructor
public class StudentAssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping
    public List<AssignmentResponse> list(Authentication authentication) {
        return assignmentService.studentAssignments(authentication.getName());
    }

    @PostMapping(
            value = "/{assignmentId}/submission",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AssignmentSubmissionResponse submit(
            Authentication authentication,
            @PathVariable Long assignmentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "remarks", required = false) String remarks) {

        return assignmentService.submit(authentication.getName(), assignmentId, file, remarks);
    }

    @GetMapping("/submissions/{submissionId}/file")
    public ResponseEntity<Resource> download(
            Authentication authentication,
            @PathVariable Long submissionId) {

        return Downloads.attachment(
                assignmentService.submissionFileForStudent(authentication.getName(), submissionId));
    }
}
