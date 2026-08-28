package com.erp.studenterp.mapper;

import com.erp.studenterp.dto.StudentResponse;
import com.erp.studenterp.entity.Student;

public class StudentMapper {

    private StudentMapper() {
    }

    public static StudentResponse toResponse(Student student) {

        return StudentResponse.builder()

                .id(student.getId())

                .enrollmentNumber(
                        student.getEnrollmentNumber()
                )

                .firstName(student.getFirstName())

                .lastName(student.getLastName())

                .email(student.getEmail())

                .mobileNumber(
                        student.getMobileNumber()
                )

                .dateOfBirth(
                        student.getDateOfBirth()
                )

                .gender(student.getGender())

                .bloodGroup(student.getBloodGroup())

                .address(student.getAddress())

                .city(student.getCity())

                .state(student.getState())

                .pincode(student.getPincode())

                .guardianName(
                        student.getGuardianName()
                )

                .guardianMobile(
                        student.getGuardianMobile()
                )

                .semester(student.getSemester())

                .section(student.getSection())

                .photoUrl(student.getPhotoUrl())

                .active(student.isActive())

                // Both are optional on the entity. A student who has not been
                // placed on a course yet must still be listable, so these read
                // as null instead of throwing.
                .departmentId(
                        student.getDepartment() == null
                                ? null
                                : student.getDepartment().getId()
                )

                .departmentName(
                        student.getDepartment() == null
                                ? null
                                : student.getDepartment().getDepartmentName()
                )

                .courseId(
                        student.getCourse() == null
                                ? null
                                : student.getCourse().getId()
                )

                .courseName(
                        student.getCourse() == null
                                ? null
                                : student.getCourse().getCourseName()
                )

                .build();
    }
}