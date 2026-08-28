package com.erp.studenterp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/** Headline numbers for the administration home page. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    private long totalStudents;

    private long totalFaculty;

    private long totalCourses;

    private long totalDepartments;

    private long totalSubjects;

    private long pendingLeaves;

    private BigDecimal feesBilled;

    private BigDecimal feesCollected;

    private BigDecimal feesOutstanding;

    /** Share of today's marked attendance that was present, 0-100. */
    private BigDecimal attendanceTodayPercent;

    private long attendanceMarkedToday;

    private long booksOnLoan;

    private long hostelResidents;

    private long transportRiders;

    private List<NoticeResponse> latestNotices;
}
