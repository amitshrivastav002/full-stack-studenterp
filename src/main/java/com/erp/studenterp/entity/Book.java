package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "library_books",
        uniqueConstraints = { @UniqueConstraint(columnNames = "isbn") }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String isbn;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    private String publisher;

    private String category;

    @Column(name = "shelf_location")
    private String shelfLocation;

    @Column(name = "total_copies", nullable = false)
    private Integer totalCopies;

    /** Kept in step with issues and returns so the catalogue stays truthful. */
    @Column(name = "available_copies", nullable = false)
    private Integer availableCopies;

    @Builder.Default
    private boolean active = true;
}
