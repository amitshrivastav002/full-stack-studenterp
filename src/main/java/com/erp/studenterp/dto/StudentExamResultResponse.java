package com.erp.studenterp.dto;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StudentExamResultResponse {
    private Long examId; private String examName; private String academicYear;
    private Long studentId; private String enrollmentNumber; private String studentName;
    private BigDecimal totalMarks; private BigDecimal obtainedMarks; private BigDecimal percentage;
    private String grade; private String result; private List<StudentMarkResponse> marks;
}
