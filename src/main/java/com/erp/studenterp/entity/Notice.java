package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "notices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notice extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 4000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NoticeAudience audience;

    /** Pinned notices sort to the top of every board. */
    @Builder.Default
    private boolean pinned = false;

    @Column(name = "publish_date", nullable = false)
    private LocalDate publishDate;

    /** Optional: after this date the notice drops off the boards. */
    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "published_by")
    private String publishedBy;

    @Builder.Default
    private boolean active = true;
}
