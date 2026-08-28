package com.erp.studenterp.dto;
import com.erp.studenterp.entity.LeaveStatus;
import lombok.*;
import java.time.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StudentLeaveResponse { private Long id; private Long studentId; private String enrollmentNumber; private String studentName; private LocalDate fromDate; private LocalDate toDate; private String reason; private LeaveStatus status; private String reviewerEmail; private LocalDateTime reviewedAt; private String reviewerComment; private LocalDateTime appliedAt; }
