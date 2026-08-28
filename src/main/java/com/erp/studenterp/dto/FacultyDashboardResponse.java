package com.erp.studenterp.dto;

import lombok.*;

import java.util.List;

/** Headline numbers for the faculty home page. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyDashboardResponse {

    private String facultyName;

    private String employeeId;

    private String departmentName;

    private long allocatedSubjects;

    private long assignmentsSet;

    private long submissionsAwaitingGrading;

    private long pendingLeaveRequests;

    /** Today's periods, in order, when an academic year is supplied. */
    private List<TimetableResponse> classesToday;

    private List<NoticeResponse> latestNotices;
}
