package com.erp.studenterp.controller;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.BookIssueStatus;
import com.erp.studenterp.service.LibraryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/library")
@RequiredArgsConstructor
public class AdminLibraryController {

    private final LibraryService libraryService;

    @PostMapping("/books")
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse createBook(@Valid @RequestBody BookRequest request) {
        return libraryService.createBook(request);
    }

    @GetMapping("/books")
    public List<BookResponse> books(@RequestParam(required = false) String keyword) {
        return libraryService.books(keyword);
    }

    @PutMapping("/books/{id}")
    public BookResponse updateBook(@PathVariable Long id, @Valid @RequestBody BookRequest request) {
        return libraryService.updateBook(id, request);
    }

    @DeleteMapping("/books/{id}")
    public MessageResponse deleteBook(@PathVariable Long id) {
        libraryService.deleteBook(id);
        return MessageResponse.of("Book removed from the catalogue");
    }

    @PostMapping("/issues")
    @ResponseStatus(HttpStatus.CREATED)
    public BookIssueResponse issue(
            Authentication authentication,
            @Valid @RequestBody BookIssueRequest request) {

        return libraryService.issue(request, authentication.getName());
    }

    @GetMapping("/issues")
    public List<BookIssueResponse> issues(@RequestParam(required = false) BookIssueStatus status) {
        return libraryService.issues(status);
    }

    @PutMapping("/issues/{issueId}/return")
    public BookIssueResponse returnBook(@PathVariable Long issueId) {
        return libraryService.returnBook(issueId);
    }

    @GetMapping("/students/{studentId}/issues")
    public List<BookIssueResponse> studentIssues(@PathVariable Long studentId) {
        return libraryService.studentIssues(studentId);
    }
}
