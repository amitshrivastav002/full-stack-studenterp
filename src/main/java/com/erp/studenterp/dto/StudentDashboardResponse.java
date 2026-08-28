package com.erp.studenterp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/** Headline numbers for the student home page. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDashboardResponse {

    private String studentName;

    private String enrollmentNumber;

    private String courseName;

    private Integer semester;

    private String section;

    /** Overall attendance across every subject, 0-100. */
    private BigDecimal attendancePercent;

    private long periodsAttended;

    private long periodsHeld;

    private BigDecimal feesOutstanding;

    private long assignmentsDue;

    private long booksHeld;

    private String hostelRoom;

    private String transportRoute;

    private long pendingLeaves;

    /** Today's periods, in order, when an academic year is supplied. */
    private List<TimetableResponse> classesToday;

    private List<NoticeResponse> latestNotices;
}
