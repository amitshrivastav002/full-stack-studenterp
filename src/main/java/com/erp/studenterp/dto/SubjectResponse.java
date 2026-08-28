package com.erp.studenterp.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectResponse {

    private Long id;

    private String subjectCode;

    private String subjectName;

    private Integer semester;

    private Integer credits;

    private boolean active;

    private Long departmentId;

    private String departmentName;

    private Long courseId;

    private String courseName;
}