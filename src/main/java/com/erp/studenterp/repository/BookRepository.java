package com.erp.studenterp.repository;

import com.erp.studenterp.entity.Book;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByIdAndActiveTrue(Long id);

    boolean existsByIsbn(String isbn);

    boolean existsByIsbnAndIdNot(String isbn, Long id);

    List<Book> findByActiveTrueOrderByTitleAsc();

    @Query("""
            SELECT b
            FROM Book b
            WHERE b.active = true
              AND (
                LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(b.author) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(b.isbn) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(b.category) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            ORDER BY b.title ASC
            """)
    List<Book> search(@Param("keyword") String keyword);
}
