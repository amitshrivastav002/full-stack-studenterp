package com.erp.studenterp.dto;

import com.erp.studenterp.entity.AttendanceStatus;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {

    private Long id;

    private Long studentId;

    private String enrollmentNumber;

    private String studentName;

    private Long facultySubjectId;

    private Long subjectId;

    private String subjectCode;

    private String subjectName;

    private LocalDate attendanceDate;

    private AttendanceStatus status;

    private String remarks;
}