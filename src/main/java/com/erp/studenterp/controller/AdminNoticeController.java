package com.erp.studenterp.controller;

import com.erp.studenterp.dto.MessageResponse;
import com.erp.studenterp.dto.NoticeRequest;
import com.erp.studenterp.dto.NoticeResponse;
import com.erp.studenterp.service.NoticeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
public class AdminNoticeController {

    private final NoticeService noticeService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NoticeResponse create(
            Authentication authentication,
            @Valid @RequestBody NoticeRequest request) {

        return noticeService.create(request, authentication.getName());
    }

    @GetMapping
    public List<NoticeResponse> list() {
        return noticeService.findAll();
    }

    @PutMapping("/{id}")
    public NoticeResponse update(
            @PathVariable Long id,
            @Valid @RequestBody NoticeRequest request) {

        return noticeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public MessageResponse delete(@PathVariable Long id) {
        noticeService.delete(id);
        return MessageResponse.of("Notice removed successfully");
    }
}
