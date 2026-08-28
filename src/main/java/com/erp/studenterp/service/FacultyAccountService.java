package com.erp.studenterp.service;

import com.erp.studenterp.dto.FacultyAccountRequest;
import com.erp.studenterp.entity.Faculty;
import com.erp.studenterp.entity.Role;
import com.erp.studenterp.entity.User;
import com.erp.studenterp.repository.FacultyRepository;
import com.erp.studenterp.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FacultyAccountService {

    private final FacultyRepository facultyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

   @Transactional
public void createAccount(
        FacultyAccountRequest request) {

    // 1. Find faculty
    Faculty faculty = facultyRepository
            .findByIdAndActiveTrue(request.getFacultyId())
            .orElseThrow(() ->
                    new RuntimeException(
                            "Faculty not found with ID: "
                                    + request.getFacultyId()
                    )
            );

    // 2. Check if faculty already has login
    if (faculty.getUser() != null) {
        throw new RuntimeException(
                "Faculty already has a login account"
        );
    }

    // 3. Check duplicate email
    if (userRepository.existsByEmail(request.getEmail())) {
        throw new RuntimeException(
                "Email is already registered"
        );
    }

    // 4. Create user
    User user = new User();

    // Full name
    String fullName =
            faculty.getFirstName()
                    + (faculty.getLastName() != null
                    && !faculty.getLastName().isBlank()
                    ? " " + faculty.getLastName()
                    : "");

    user.setFullName(fullName);

    user.setEmail(request.getEmail());

    user.setPassword(
            passwordEncoder.encode(
                    request.getPassword()
            )
    );

    user.setRole(Role.FACULTY);

    // 5. Save user
    User savedUser =
            userRepository.save(user);

    // 6. Connect User with Faculty
    faculty.setUser(savedUser);

    facultyRepository.save(faculty);
}}