package com.erp.studenterp.dto;
import lombok.*;
import java.math.BigDecimal;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StudentMarkResponse {
    private Long id; private Long studentId; private String enrollmentNumber; private String studentName;
    private Long examSubjectId; private String subjectName; private BigDecimal maxMarks;
    private BigDecimal passMarks; private BigDecimal marksObtained; private boolean passed;
}
