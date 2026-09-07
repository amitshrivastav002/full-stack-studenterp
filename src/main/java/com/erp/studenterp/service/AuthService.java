package com.erp.studenterp.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.studenterp.dto.GoogleLoginRequest;
import com.erp.studenterp.dto.LoginRequest;
import com.erp.studenterp.dto.LoginResponse;
import com.erp.studenterp.dto.RegisterRequest;
import com.erp.studenterp.dto.SignupRequest;
import com.erp.studenterp.entity.Role;
import com.erp.studenterp.entity.Student;
import com.erp.studenterp.entity.User;
import com.erp.studenterp.exception.ConflictException;
import com.erp.studenterp.exception.NotFoundException;
import com.erp.studenterp.exception.UnauthorizedException;
import com.erp.studenterp.repository.StudentRepository;
import com.erp.studenterp.repository.UserRepository;
import com.erp.studenterp.security.JwtUtil;

import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Value("${google.client-id:}")
    private String googleClientId;

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

        User saved = repository.save(user);
        provisionStudentRecord(saved);
    }

    @Transactional
    public void register(RegisterRequest request) {

        // Student and faculty logins must be linked to their Student/Faculty
        // record (via the dedicated admin flows) or the account signs in
        // successfully but every portal endpoint 404s looking up that record.
        // This generic endpoint has no way to create that link, so it is
        // restricted to accounts that don't need one.
        if (request.getRole() != Role.ADMIN) {
            throw new ConflictException(
                    "Student and faculty logins must be created from their Student/Faculty record, not here.");
        }

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

        return new LoginResponse(token, user.getRole(), user.getFullName(), user.getEmail());
    }

    /**
     * Verifies the Google ID token against Google's own public keys, then signs the
     * matching account in — creating a new STUDENT account on first sign-in, since
     * this is the same public entry point as {@link #signup}. Accounts created this
     * way have no password, so they can only ever sign in through Google.
     */
    @Transactional
    public LoginResponse googleLogin(GoogleLoginRequest request) {

        GoogleIdToken.Payload payload = verifyGoogleToken(request.getIdToken());

        String email = payload.getEmail().trim().toLowerCase();
        String fullName = (String) payload.get("name");

        User user = repository.findByEmail(email).orElseGet(() -> {
            User created = new User();
            created.setFullName(fullName != null && !fullName.isBlank() ? fullName : email);
            created.setEmail(email);
            created.setRole(Role.STUDENT);
            User savedUser = repository.save(created);
            provisionStudentRecord(savedUser);
            return savedUser;
        });

        String token = jwtUtil.generateToken(user.getEmail());

        return new LoginResponse(token, user.getRole(), user.getFullName(), user.getEmail());
    }

    /**
     * Self-service sign-up (plain or Google) has no separate step for creating the
     * Student record the portal endpoints look up by email — that's normally an
     * admin action for pre-existing enrollees — so a freshly created STUDENT account
     * provisions a minimal one of its own here. Otherwise the account signs in fine
     * but every student portal page 404s looking up that record. Academic fields
     * (course/semester/section) are left for an admin to fill in later.
     */
    private void provisionStudentRecord(User user) {
        if (studentRepository.existsByEmail(user.getEmail())) {
            return;
        }

        String fullName = user.getFullName() != null ? user.getFullName().trim() : "";
        String firstName = fullName;
        String lastName = null;
        int spaceIndex = fullName.indexOf(' ');
        if (spaceIndex > 0) {
            firstName = fullName.substring(0, spaceIndex);
            lastName = fullName.substring(spaceIndex + 1).trim();
        }
        if (firstName.isBlank()) {
            firstName = user.getEmail();
        }

        Student student = new Student();
        student.setFirstName(firstName);
        student.setLastName(lastName);
        student.setEmail(user.getEmail());
        student.setEnrollmentNumber("SELF-" + user.getId());
        student.setActive(true);
        student.setUser(user);

        studentRepository.save(student);
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idToken) {

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new UnauthorizedException("Invalid Google sign-in token");
            }
            return token.getPayload();
        } catch (GeneralSecurityException | IOException | IllegalArgumentException e) {
            throw new UnauthorizedException("Invalid Google sign-in token");
        }
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
