package com.erp.studenterp.mapper;

import com.erp.studenterp.dto.SubjectResponse;
import com.erp.studenterp.entity.Subject;

public class SubjectMapper {

    private SubjectMapper() {
    }

    public static SubjectResponse toResponse(
            Subject subject) {

        return SubjectResponse.builder()
                .id(subject.getId())
                .subjectCode(subject.getSubjectCode())
                .subjectName(subject.getSubjectName())
                .semester(subject.getSemester())
                .credits(subject.getCredits())
                .active(subject.isActive())

                .departmentId(
                        subject.getDepartment().getId()
                )

                .departmentName(
                        subject.getDepartment()
                                .getDepartmentName()
                )

                .courseId(
                        subject.getCourse().getId()
                )

                .courseName(
                        subject.getCourse()
                                .getCourseName()
                )

                .build();
    }
}