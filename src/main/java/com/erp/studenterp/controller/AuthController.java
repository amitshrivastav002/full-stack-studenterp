package com.erp.studenterp.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.erp.studenterp.dto.GoogleLoginRequest;
import com.erp.studenterp.dto.LoginRequest;
import com.erp.studenterp.dto.LoginResponse;
import com.erp.studenterp.dto.MessageResponse;
import com.erp.studenterp.dto.RegisterRequest;
import com.erp.studenterp.dto.SignupRequest;
import com.erp.studenterp.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    /** Admin-only: creating accounts is not a public action. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse register(@Valid @RequestBody RegisterRequest request) {
        service.register(request);
        return MessageResponse.of("Account created successfully");
    }

    /** Public: creates a STUDENT account. The role is not client-controlled. */
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse signup(@Valid @RequestBody SignupRequest request) {
        service.signup(request);
        return MessageResponse.of("Account created successfully");
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return service.login(request);
    }

    /**
     * Public: signs in with a Google ID token, creating a STUDENT account on first
     * sign-in. Same role restriction as {@link #signup} and for the same reason.
     */
    @PostMapping("/google")
    public LoginResponse google(@Valid @RequestBody GoogleLoginRequest request) {
        return service.googleLogin(request);
    }
}
