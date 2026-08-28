package com.erp.studenterp.dto;
import lombok.*;
import java.time.LocalDate;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ExamResponse {
    private Long id; private String examName; private LocalDate examDate;
    private Integer semester; private String academicYear; private Long courseId; private String courseName;
}
