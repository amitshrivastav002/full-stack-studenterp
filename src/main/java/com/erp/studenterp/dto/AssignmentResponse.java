package com.erp.studenterp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponse {

    private Long id;

    private Long facultySubjectId;

    private Long subjectId;

    private String subjectCode;

    private String subjectName;

    private Integer semester;

    private String section;

    private String academicYear;

    private String facultyName;

    private String title;

    private String description;

    private LocalDate dueDate;

    private BigDecimal maxMarks;

    private String attachmentName;

    private boolean overdue;

    /** Faculty view: how many students have handed in and how many are marked. */
    private Long submissionCount;

    private Long gradedCount;

    /** Student view: this student's own submission, when they have made one. */
    private AssignmentSubmissionResponse mySubmission;

    private LocalDateTime createdAt;
}
