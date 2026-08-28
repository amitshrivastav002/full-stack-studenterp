package com.erp.studenterp.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceStudentResponse {

    private Long studentId;

    private String enrollmentNumber;

    private String studentName;

    private Integer semester;

    private String section;
}