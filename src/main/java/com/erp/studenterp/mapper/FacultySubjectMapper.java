package com.erp.studenterp.mapper;

import com.erp.studenterp.dto.FacultySubjectResponse;
import com.erp.studenterp.entity.FacultySubject;

public class FacultySubjectMapper {

    private FacultySubjectMapper() {
    }

    public static FacultySubjectResponse toResponse(
            FacultySubject assignment) {

        String facultyName =
                assignment.getFaculty().getFirstName()
                        + (
                        assignment.getFaculty().getLastName() != null
                                ? " " + assignment.getFaculty().getLastName()
                                : ""
                );

        return FacultySubjectResponse.builder()

                .id(assignment.getId())

                .facultyId(
                        assignment.getFaculty().getId()
                )

                .employeeId(
                        assignment.getFaculty().getEmployeeId()
                )

                .facultyName(facultyName)

                .subjectId(
                        assignment.getSubject().getId()
                )

                .courseName(
                        assignment.getSubject()
                                .getCourse()
                                .getCourseName()
                )

                .subjectCode(
                        assignment.getSubject().getSubjectCode()
                )

                .subjectName(
                        assignment.getSubject().getSubjectName()
                )

                .semester(
                        assignment.getSubject().getSemester()
                )

                .academicYear(
                        assignment.getAcademicYear()
                )

                .section(
                        assignment.getSection()
                )

                .active(
                        assignment.isActive()
                )

                .build();
    }
}