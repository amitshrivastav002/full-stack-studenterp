package com.erp.studenterp.controller;

import com.erp.studenterp.dto.FacultyAccountRequest;
import com.erp.studenterp.service.FacultyAccountService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/faculty-accounts")
@RequiredArgsConstructor
public class FacultyAccountController {

    private final FacultyAccountService facultyAccountService;

    @PostMapping
    public ResponseEntity<String> createAccount(
            @Valid
            @RequestBody FacultyAccountRequest request) {

        facultyAccountService.createAccount(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        "Faculty login account created successfully"
                );
    }
}