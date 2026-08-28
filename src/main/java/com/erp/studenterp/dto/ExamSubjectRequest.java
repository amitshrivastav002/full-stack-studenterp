package com.erp.studenterp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ExamSubjectRequest {
    @NotNull private Long subjectId;
    @NotNull @DecimalMin("0.01") private BigDecimal maxMarks;
    @NotNull @DecimalMin("0.00") private BigDecimal passMarks;
}
