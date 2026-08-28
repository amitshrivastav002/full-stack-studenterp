package com.erp.studenterp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class FacultyRequest {

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    @NotBlank(message = "First name is required")
    private String firstName;

    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email")
    private String email;

    @NotBlank(message = "Mobile number is required")
    @Pattern(
        regexp = "^[0-9]{10}$",
        message = "Mobile number must contain 10 digits"
    )
    private String mobileNumber;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    private String gender;

    @NotBlank(message = "Designation is required")
    private String designation;

    private String qualification;

    private LocalDate joiningDate;

    private String address;

    private String city;

    private String state;

    @Pattern(
        regexp = "^[0-9]{6}$",
        message = "Pincode must contain 6 digits"
    )
    private String pincode;

    @NotNull(message = "Department is required")
    private Long departmentId;
}