package com.erp.studenterp.dto;

import com.erp.studenterp.entity.NoticeAudience;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoticeResponse {

    private Long id;

    private String title;

    private String content;

    private NoticeAudience audience;

    private boolean pinned;

    private LocalDate publishDate;

    private LocalDate expiryDate;

    private String publishedBy;

    private LocalDateTime createdAt;
}
