package com.erp.studenterp.dto;
import lombok.*;
import java.math.BigDecimal;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ExamSubjectResponse {
    private Long id; private Long subjectId; private String subjectCode; private String subjectName;
    private BigDecimal maxMarks; private BigDecimal passMarks;
}
