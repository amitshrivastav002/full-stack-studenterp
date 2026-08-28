package com.erp.studenterp.service;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.*;
import com.erp.studenterp.exception.BadRequestException;
import com.erp.studenterp.exception.ConflictException;
import com.erp.studenterp.exception.NotFoundException;
import com.erp.studenterp.repository.BookIssueRepository;
import com.erp.studenterp.repository.BookRepository;
import com.erp.studenterp.repository.StudentRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LibraryService {

    private final BookRepository bookRepository;
    private final BookIssueRepository issueRepository;
    private final StudentRepository studentRepository;

    /** Charged for each day a book is kept past its due date. */
    @Value("${app.library.fine-per-day:5.00}")
    private BigDecimal finePerDay;

    /** How many books one student may hold at the same time. */
    @Value("${app.library.max-books-per-student:3}")
    private int maxBooksPerStudent;

    // ------------------------------------------------------------- catalogue

    @Transactional
    public BookResponse createBook(BookRequest request) {

        String isbn = request.getIsbn().trim();

        if (bookRepository.existsByIsbn(isbn)) {
            throw new ConflictException("A book with ISBN " + isbn + " already exists");
        }

        Book book = Book.builder()
                .isbn(isbn)
                .title(request.getTitle().trim())
                .author(request.getAuthor().trim())
                .publisher(request.getPublisher())
                .category(request.getCategory())
                .shelfLocation(request.getShelfLocation())
                .totalCopies(request.getTotalCopies())
                .availableCopies(request.getTotalCopies())
                .active(true)
                .build();

        return toBookResponse(bookRepository.save(book));
    }

    @Transactional
    public BookResponse updateBook(Long id, BookRequest request) {

        Book book = requireBook(id);
        String isbn = request.getIsbn().trim();

        if (bookRepository.existsByIsbnAndIdNot(isbn, id)) {
            throw new ConflictException("A book with ISBN " + isbn + " already exists");
        }

        // Copies already out on loan must stay accounted for when the stock changes.
        int onLoan = book.getTotalCopies() - book.getAvailableCopies();
        if (request.getTotalCopies() < onLoan) {
            throw new BadRequestException(
                    "There are " + onLoan + " copies on loan, so total copies cannot be lower");
        }

        book.setIsbn(isbn);
        book.setTitle(request.getTitle().trim());
        book.setAuthor(request.getAuthor().trim());
        book.setPublisher(request.getPublisher());
        book.setCategory(request.getCategory());
        book.setShelfLocation(request.getShelfLocation());
        book.setTotalCopies(request.getTotalCopies());
        book.setAvailableCopies(request.getTotalCopies() - onLoan);

        return toBookResponse(bookRepository.save(book));
    }

    @Transactional
    public void deleteBook(Long id) {

        Book book = requireBook(id);

        if (book.getAvailableCopies() < book.getTotalCopies()) {
            throw new BadRequestException(
                    "This book cannot be removed while copies are still on loan");
        }

        book.setActive(false);
        bookRepository.save(book);
    }

    @Transactional(readOnly = true)
    public List<BookResponse> books(String keyword) {

        List<Book> books = keyword == null || keyword.isBlank()
                ? bookRepository.findByActiveTrueOrderByTitleAsc()
                : bookRepository.search(keyword.trim());

        return books.stream().map(this::toBookResponse).toList();
    }

    // ---------------------------------------------------------- issue/return

    @Transactional
    public BookIssueResponse issue(BookIssueRequest request, String issuedBy) {

        Book book = requireBook(request.getBookId());

        Student student = studentRepository.findByIdAndActiveTrue(request.getStudentId())
                .orElseThrow(() -> NotFoundException.of("Student", request.getStudentId()));

        if (book.getAvailableCopies() <= 0) {
            throw new BadRequestException("No copies of this book are available right now");
        }

        if (request.getDueDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("The due date cannot be in the past");
        }

        if (issueRepository.existsByBookIdAndStudentIdAndStatus(
                book.getId(), student.getId(), BookIssueStatus.ISSUED)) {
            throw new ConflictException("This student already has a copy of this book");
        }

        long held = issueRepository.countByStudentIdAndStatus(
                student.getId(), BookIssueStatus.ISSUED);

        if (held >= maxBooksPerStudent) {
            throw new BadRequestException(
                    "A student may hold at most " + maxBooksPerStudent + " books at a time");
        }

        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        BookIssue issue = BookIssue.builder()
                .book(book)
                .student(student)
                .issuedOn(LocalDate.now())
                .dueDate(request.getDueDate())
                .status(BookIssueStatus.ISSUED)
                .fineAmount(BigDecimal.ZERO)
                .issuedBy(issuedBy)
                .remarks(request.getRemarks())
                .build();

        return toIssueResponse(issueRepository.save(issue));
    }

    @Transactional
    public BookIssueResponse returnBook(Long issueId) {

        BookIssue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> NotFoundException.of("Book issue", issueId));

        if (issue.getStatus() == BookIssueStatus.RETURNED) {
            throw new ConflictException("This book has already been returned");
        }

        LocalDate today = LocalDate.now();
        long daysLate = daysOverdue(issue.getDueDate(), today);

        issue.setReturnedOn(today);
        issue.setStatus(BookIssueStatus.RETURNED);
        issue.setFineAmount(finePerDay.multiply(BigDecimal.valueOf(daysLate)));

        Book book = issue.getBook();
        book.setAvailableCopies(Math.min(book.getAvailableCopies() + 1, book.getTotalCopies()));
        bookRepository.save(book);

        return toIssueResponse(issueRepository.save(issue));
    }

    @Transactional(readOnly = true)
    public List<BookIssueResponse> issues(BookIssueStatus status) {

        List<BookIssue> issues = status == null
                ? issueRepository.findAllByOrderByIssuedOnDescIdDesc()
                : issueRepository.findByStatusOrderByDueDateAsc(status);

        return issues.stream().map(this::toIssueResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<BookIssueResponse> studentIssues(Long studentId) {
        return issueRepository.findByStudentIdOrderByIssuedOnDesc(studentId)
                .stream()
                .map(this::toIssueResponse)
                .toList();
    }

    // ------------------------------------------------------------- helpers

    private Book requireBook(Long id) {
        return bookRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> NotFoundException.of("Book", id));
    }

    private long daysOverdue(LocalDate dueDate, LocalDate asOf) {
        return asOf.isAfter(dueDate) ? ChronoUnit.DAYS.between(dueDate, asOf) : 0;
    }

    private BookResponse toBookResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .isbn(book.getIsbn())
                .title(book.getTitle())
                .author(book.getAuthor())
                .publisher(book.getPublisher())
                .category(book.getCategory())
                .shelfLocation(book.getShelfLocation())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .active(book.isActive())
                .build();
    }

    private BookIssueResponse toIssueResponse(BookIssue issue) {

        Student student = issue.getStudent();
        Book book = issue.getBook();

        long daysLate = issue.getStatus() == BookIssueStatus.ISSUED
                ? daysOverdue(issue.getDueDate(), LocalDate.now())
                : daysOverdue(issue.getDueDate(), issue.getReturnedOn());

        return BookIssueResponse.builder()
                .id(issue.getId())
                .bookId(book.getId())
                .isbn(book.getIsbn())
                .bookTitle(book.getTitle())
                .author(book.getAuthor())
                .studentId(student.getId())
                .enrollmentNumber(student.getEnrollmentNumber())
                .studentName(student.getFirstName()
                        + (student.getLastName() == null ? "" : " " + student.getLastName()))
                .issuedOn(issue.getIssuedOn())
                .dueDate(issue.getDueDate())
                .returnedOn(issue.getReturnedOn())
                // Still out and past due: show what the fine would come to today.
                .fineAmount(issue.getStatus() == BookIssueStatus.ISSUED
                        ? finePerDay.multiply(BigDecimal.valueOf(daysLate))
                        : issue.getFineAmount())
                .status(issue.getStatus())
                .overdue(issue.getStatus() == BookIssueStatus.ISSUED && daysLate > 0)
                .daysOverdue(daysLate)
                .remarks(issue.getRemarks())
                .build();
    }
}
