package com.erp.studenterp.service;

import com.erp.studenterp.dto.StudentAccountRequest;
import com.erp.studenterp.entity.Role;
import com.erp.studenterp.entity.Student;
import com.erp.studenterp.entity.User;
import com.erp.studenterp.repository.StudentRepository;
import com.erp.studenterp.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudentAccountService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void createAccount(StudentAccountRequest request) {

        Student student = studentRepository
                .findByIdAndActiveTrue(request.getStudentId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Student not found with ID: "
                                        + request.getStudentId()
                        )
                );

        if (student.getUser() != null) {
            throw new RuntimeException(
                    "Student already has a login account"
            );
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException(
                    "Email is already registered"
            );
        }

        User user = new User();

        String fullName =
                student.getFirstName()
                        + (student.getLastName() != null
                        && !student.getLastName().isBlank()
                        ? " " + student.getLastName()
                        : "");

        user.setFullName(fullName);
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.STUDENT);

        User savedUser = userRepository.save(user);

        student.setUser(savedUser);
        studentRepository.save(student);
    }
}
