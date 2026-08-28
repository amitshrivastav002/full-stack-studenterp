package com.erp.studenterp.dto;
import com.erp.studenterp.entity.LeaveStatus;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data public class LeaveDecisionRequest { @NotNull private LeaveStatus status; @Size(max=1000) private String reviewerComment; }
