package com.erp.studenterp.dto;

import com.erp.studenterp.entity.SubmissionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentSubmissionResponse {

    private Long id;

    private Long assignmentId;

    private String assignmentTitle;

    private Long studentId;

    private String enrollmentNumber;

    private String studentName;

    private String fileName;

    private LocalDateTime submittedAt;

    private String remarks;

    private SubmissionStatus status;

    private BigDecimal marksObtained;

    private BigDecimal maxMarks;

    private String feedback;

    private LocalDateTime gradedAt;

    private String gradedBy;
}
