package com.erp.studenterp.repository;

import com.erp.studenterp.entity.BookIssue;
import com.erp.studenterp.entity.BookIssueStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookIssueRepository extends JpaRepository<BookIssue, Long> {

    List<BookIssue> findAllByOrderByIssuedOnDescIdDesc();

    List<BookIssue> findByStatusOrderByDueDateAsc(BookIssueStatus status);

    List<BookIssue> findByStudentIdOrderByIssuedOnDesc(Long studentId);

    long countByStudentIdAndStatus(Long studentId, BookIssueStatus status);

    long countByStatus(BookIssueStatus status);

    boolean existsByBookIdAndStudentIdAndStatus(
            Long bookId, Long studentId, BookIssueStatus status);
}
