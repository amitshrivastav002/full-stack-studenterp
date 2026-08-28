package com.erp.studenterp.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultySubjectResponse {

    private Long id;

    private Long facultyId;

    private String employeeId;

    private String facultyName;

    private Long subjectId;

    private String courseName;

    private String subjectCode;

    private String subjectName;

    private Integer semester;

    private String academicYear;

    private String section;

    private boolean active;
}