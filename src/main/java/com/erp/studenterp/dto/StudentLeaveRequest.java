package com.erp.studenterp.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
@Data public class StudentLeaveRequest { @NotNull private LocalDate fromDate; @NotNull private LocalDate toDate; @NotBlank @Size(max=1000) private String reason; }
