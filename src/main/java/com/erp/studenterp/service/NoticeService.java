package com.erp.studenterp.service;

import com.erp.studenterp.dto.NoticeRequest;
import com.erp.studenterp.dto.NoticeResponse;
import com.erp.studenterp.entity.Notice;
import com.erp.studenterp.entity.NoticeAudience;
import com.erp.studenterp.entity.Role;
import com.erp.studenterp.exception.BadRequestException;
import com.erp.studenterp.exception.NotFoundException;
import com.erp.studenterp.repository.NoticeRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;

    @Transactional
    public NoticeResponse create(NoticeRequest request, String publishedBy) {

        validateDates(request);

        Notice notice = Notice.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .audience(request.getAudience())
                .publishDate(request.getPublishDate())
                .expiryDate(request.getExpiryDate())
                .pinned(request.isPinned())
                .publishedBy(publishedBy)
                .active(true)
                .build();

        return toResponse(noticeRepository.save(notice));
    }

    @Transactional
    public NoticeResponse update(Long id, NoticeRequest request) {

        validateDates(request);

        Notice notice = noticeRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> NotFoundException.of("Notice", id));

        notice.setTitle(request.getTitle().trim());
        notice.setContent(request.getContent().trim());
        notice.setAudience(request.getAudience());
        notice.setPublishDate(request.getPublishDate());
        notice.setExpiryDate(request.getExpiryDate());
        notice.setPinned(request.isPinned());

        return toResponse(noticeRepository.save(notice));
    }

    /** Soft delete, so a notice pulled from the board stays auditable. */
    @Transactional
    public void delete(Long id) {

        Notice notice = noticeRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> NotFoundException.of("Notice", id));

        notice.setActive(false);
        noticeRepository.save(notice);
    }

    /** Every notice, including scheduled and expired ones, for the admin board. */
    @Transactional(readOnly = true)
    public List<NoticeResponse> findAll() {
        return noticeRepository.findByActiveTrueOrderByPinnedDescPublishDateDescIdDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** Only live notices aimed at the caller's role. */
    @Transactional(readOnly = true)
    public List<NoticeResponse> findForRole(Role role) {

        NoticeAudience audience = switch (role) {
            case STUDENT -> NoticeAudience.STUDENTS;
            case FACULTY -> NoticeAudience.FACULTY;
            case ADMIN -> NoticeAudience.ALL;
        };

        if (role == Role.ADMIN) {
            return findAll();
        }

        return noticeRepository.findVisible(audience, LocalDate.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateDates(NoticeRequest request) {
        if (request.getExpiryDate() != null
                && request.getExpiryDate().isBefore(request.getPublishDate())) {
            throw new BadRequestException("Expiry date cannot be before the publish date");
        }
    }

    private NoticeResponse toResponse(Notice notice) {
        return NoticeResponse.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .audience(notice.getAudience())
                .pinned(notice.isPinned())
                .publishDate(notice.getPublishDate())
                .expiryDate(notice.getExpiryDate())
                .publishedBy(notice.getPublishedBy())
                .createdAt(notice.getCreatedAt())
                .build();
    }
}
