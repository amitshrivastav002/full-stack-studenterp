package com.erp.studenterp.repository;

import com.erp.studenterp.entity.Notice;
import com.erp.studenterp.entity.NoticeAudience;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    Optional<Notice> findByIdAndActiveTrue(Long id);

    List<Notice> findByActiveTrueOrderByPinnedDescPublishDateDescIdDesc();

    /** Live notices for one audience: published, not expired, and aimed at them. */
    @Query("""
            SELECT n
            FROM Notice n
            WHERE n.active = true
              AND n.publishDate <= :today
              AND (n.expiryDate IS NULL OR n.expiryDate >= :today)
              AND (n.audience = :audience OR n.audience = com.erp.studenterp.entity.NoticeAudience.ALL)
            ORDER BY n.pinned DESC, n.publishDate DESC, n.id DESC
            """)
    List<Notice> findVisible(
            @Param("audience") NoticeAudience audience,
            @Param("today") LocalDate today);
}
