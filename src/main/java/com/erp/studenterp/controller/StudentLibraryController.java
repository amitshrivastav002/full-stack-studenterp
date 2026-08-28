package com.erp.studenterp.controller;

import com.erp.studenterp.dto.BookIssueResponse;
import com.erp.studenterp.dto.BookResponse;
import com.erp.studenterp.service.LibraryService;
import com.erp.studenterp.service.ProfileService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/library")
@RequiredArgsConstructor
public class StudentLibraryController {

    private final LibraryService libraryService;
    private final ProfileService profileService;

    /** The books this student currently holds, plus everything they have returned. */
    @GetMapping("/my-books")
    public List<BookIssueResponse> myBooks(Authentication authentication) {
        return libraryService.studentIssues(
                profileService.requireStudent(authentication.getName()).getId());
    }

    /** Read-only catalogue so students can check what the library stocks. */
    @GetMapping("/catalogue")
    public List<BookResponse> catalogue(@RequestParam(required = false) String keyword) {
        return libraryService.books(keyword);
    }
}
