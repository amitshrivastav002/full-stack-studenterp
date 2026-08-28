package com.erp.studenterp.dto;

import com.erp.studenterp.entity.BookIssueStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookIssueResponse {

    private Long id;

    private Long bookId;

    private String isbn;

    private String bookTitle;

    private String author;

    private Long studentId;

    private String enrollmentNumber;

    private String studentName;

    private LocalDate issuedOn;

    private LocalDate dueDate;

    private LocalDate returnedOn;

    private BigDecimal fineAmount;

    private BookIssueStatus status;

    /** True while the book is still out and the due date has passed. */
    private boolean overdue;

    /** Days past the due date, or zero when it is not overdue. */
    private long daysOverdue;

    private String remarks;
}
