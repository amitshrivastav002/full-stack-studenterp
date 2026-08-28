package com.erp.studenterp.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendanceSummary {

    private Long subjectId;

    private String subjectCode;

    private String subjectName;

    private Long totalClasses;

    private Long presentClasses;

    private Long absentClasses;

    private Long lateClasses;

    private Long excusedClasses;

    private Double attendancePercentage;

    private boolean lowAttendance;
}