package com.erp.studenterp.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {

    private Long id;

    private String isbn;

    private String title;

    private String author;

    private String publisher;

    private String category;

    private String shelfLocation;

    private Integer totalCopies;

    private Integer availableCopies;

    private boolean active;
}
