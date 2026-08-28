package com.erp.studenterp.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyResponse {

    private Long id;

    private String employeeId;

    private String firstName;

    private String lastName;

    private String email;

    private String mobileNumber;

    private LocalDate dateOfBirth;

    private String gender;

    private String designation;

    private String qualification;

    private LocalDate joiningDate;

    private String address;

    private String city;

    private String state;

    private String pincode;

    private String photoUrl;

    private boolean active;

    private Long departmentId;

    private String departmentName;
}