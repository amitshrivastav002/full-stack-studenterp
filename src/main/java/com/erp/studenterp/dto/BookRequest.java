package com.erp.studenterp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class BookRequest {

    @NotBlank(message = "ISBN is required")
    @Size(max = 20, message = "ISBN cannot exceed 20 characters")
    private String isbn;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Author is required")
    private String author;

    private String publisher;

    private String category;

    private String shelfLocation;

    @NotNull(message = "Total copies is required")
    @Min(value = 1, message = "There must be at least one copy")
    private Integer totalCopies;
}
