package com.erp.studenterp.controller;

import com.erp.studenterp.dto.StudentAccountRequest;
import com.erp.studenterp.service.StudentAccountService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/student-accounts")
@RequiredArgsConstructor
public class StudentAccountController {

    private final StudentAccountService studentAccountService;

    @PostMapping
    public ResponseEntity<String> createAccount(
            @Valid
            @RequestBody StudentAccountRequest request) {

        studentAccountService.createAccount(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        "Student login account created successfully"
                );
    }
}
