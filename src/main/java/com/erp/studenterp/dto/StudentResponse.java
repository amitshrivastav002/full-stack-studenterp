package com.erp.studenterp.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {

    private Long id;

    private String enrollmentNumber;

    private String firstName;

    private String lastName;

    private String email;

    private String mobileNumber;

    private LocalDate dateOfBirth;

    private String gender;

    private String bloodGroup;

    private String address;

    private String city;

    private String state;

    private String pincode;

    private String guardianName;

    private String guardianMobile;

    private Integer semester;

    private String section;

    private String photoUrl;

    private boolean active;

    private Long departmentId;

    private String departmentName;

    private Long courseId;

    private String courseName;
}