package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity
@Table(name = "student_leaves")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentLeave extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "student_id", nullable = false)
    private Student student;
    @Column(name = "from_date", nullable = false) private LocalDate fromDate;
    @Column(name = "to_date", nullable = false) private LocalDate toDate;
    @Column(nullable = false, length = 1000) private String reason;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private LeaveStatus status;
    @Column(name = "reviewer_email") private String reviewerEmail;
    @Column(name = "reviewed_at") private LocalDateTime reviewedAt;
    @Column(name = "reviewer_comment", length = 1000) private String reviewerComment;
}
