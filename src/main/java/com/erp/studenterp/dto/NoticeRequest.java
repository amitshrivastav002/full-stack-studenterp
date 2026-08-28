package com.erp.studenterp.dto;

import com.erp.studenterp.entity.NoticeAudience;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class NoticeRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(max = 4000, message = "Content cannot exceed 4000 characters")
    private String content;

    @NotNull(message = "Audience is required")
    private NoticeAudience audience;

    @NotNull(message = "Publish date is required")
    private LocalDate publishDate;

    private LocalDate expiryDate;

    private boolean pinned;
}
