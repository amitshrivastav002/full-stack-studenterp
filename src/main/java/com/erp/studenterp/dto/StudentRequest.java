package com.erp.studenterp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StudentRequest {

    @NotBlank(message = "Enrollment number is required")
    private String enrollmentNumber;

    @NotBlank(message = "First name is required")
    private String firstName;

    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Mobile number is required")
    @Pattern(
        regexp = "^[0-9]{10}$",
        message = "Mobile number must contain 10 digits"
    )
    private String mobileNumber;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Gender is required")
    private String gender;

    private String bloodGroup;

    private String address;
    private String city;
    private String state;

    @Pattern(
        regexp = "^[0-9]{6}$",
        message = "Pincode must contain 6 digits"
    )
    private String pincode;

    private String guardianName;

    @Pattern(
        regexp = "^[0-9]{10}$",
        message = "Guardian mobile must contain 10 digits"
    )
    private String guardianMobile;

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be at least 1")
    @Max(value = 8, message = "Semester cannot exceed 8")
    private Integer semester;

    private String section;

    @NotNull(message = "Department is required")
    private Long departmentId;

    @NotNull(message = "Course is required")
    private Long courseId;
}