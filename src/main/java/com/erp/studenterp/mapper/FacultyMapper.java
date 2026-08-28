package com.erp.studenterp.mapper;

import com.erp.studenterp.dto.FacultyResponse;
import com.erp.studenterp.entity.Faculty;

public class FacultyMapper {

    private FacultyMapper() {
    }

    public static FacultyResponse toResponse(
            Faculty faculty) {

        return FacultyResponse.builder()

                .id(faculty.getId())

                .employeeId(
                        faculty.getEmployeeId()
                )

                .firstName(
                        faculty.getFirstName()
                )

                .lastName(
                        faculty.getLastName()
                )

                .email(
                        faculty.getEmail()
                )

                .mobileNumber(
                        faculty.getMobileNumber()
                )

                .dateOfBirth(
                        faculty.getDateOfBirth()
                )

                .gender(
                        faculty.getGender()
                )

                .designation(
                        faculty.getDesignation()
                )

                .qualification(
                        faculty.getQualification()
                )

                .joiningDate(
                        faculty.getJoiningDate()
                )

                .address(
                        faculty.getAddress()
                )

                .city(
                        faculty.getCity()
                )

                .state(
                        faculty.getState()
                )

                .pincode(
                        faculty.getPincode()
                )

                .photoUrl(
                        faculty.getPhotoUrl()
                )

                .active(
                        faculty.isActive()
                )

                .departmentId(
                        faculty.getDepartment().getId()
                )

                .departmentName(
                        faculty.getDepartment()
                                .getDepartmentName()
                )

                .build();
    }
}