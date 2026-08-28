package com.erp.studenterp.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.studenterp.dto.LoginRequest;
import com.erp.studenterp.dto.LoginResponse;
import com.erp.studenterp.dto.RegisterRequest;
import com.erp.studenterp.dto.SignupRequest;
import com.erp.studenterp.entity.Role;
import com.erp.studenterp.entity.User;
import com.erp.studenterp.exception.ConflictException;
import com.erp.studenterp.exception.NotFoundException;
import com.erp.studenterp.exception.UnauthorizedException;
import com.erp.studenterp.repository.UserRepository;
import com.erp.studenterp.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    /**
     * Public sign-up.  The role is hard-coded rather than taken from the request:
     * this endpoint is unauthenticated, so honouring a client-supplied role would
     * let anybody mint themselves an administrator account.
     */
    @Transactional
    public void signup(SignupRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        if (repository.existsByEmail(email)) {
            throw new ConflictException("An account already exists for " + email);
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPassword(encoder.encode(request.getPassword()));
        user.setRole(Role.STUDENT);

        repository.save(user);
    }

    @Transactional
    public void register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        if (repository.existsByEmail(email)) {
            throw new ConflictException("An account already exists for " + email);
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPassword(encoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        repository.save(user);
    }

    /**
     * Verifies credentials through the authentication manager so a locked or unknown
     * account fails the same way, then returns the token together with the role the
     * client needs in order to land on the right portal.
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (AuthenticationException exception) {
            throw new UnauthorizedException("Invalid email or password");
        }

        User user = repository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        String token = jwtUtil.generateToken(user.getEmail());

        return new LoginResponse(token, user.getRole(), user.getFullName());
    }

    /** Changes the signed-in user's own password after re-checking the current one. */
    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {

        User user = repository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        if (!encoder.matches(currentPassword, user.getPassword())) {
            throw new UnauthorizedException("Your current password is incorrect");
        }

        if (encoder.matches(newPassword, user.getPassword())) {
            throw new ConflictException("The new password must differ from the current one");
        }

        user.setPassword(encoder.encode(newPassword));
        repository.save(user);
    }
}
