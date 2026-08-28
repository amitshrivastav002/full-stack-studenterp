package com.erp.studenterp.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentFeeDashboardResponse {
    private Long studentId;
    private String enrollmentNumber;
    private String studentName;
    private BigDecimal totalFee;
    private BigDecimal paidAmount;
    private BigDecimal dueAmount;
    private long pendingFeeCount;
    private long partialFeeCount;
    private long paidFeeCount;
    private List<StudentFeeResponse> fees;
}
