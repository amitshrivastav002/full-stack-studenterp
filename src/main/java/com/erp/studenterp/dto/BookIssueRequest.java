package com.erp.studenterp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BookIssueRequest {

    @NotNull(message = "Select a book")
    private Long bookId;

    @NotNull(message = "Select a student")
    private Long studentId;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    private String remarks;
}
