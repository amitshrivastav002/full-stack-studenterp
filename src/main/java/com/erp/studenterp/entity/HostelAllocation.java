package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "hostel_allocations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HostelAllocation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private HostelRoom room;

    @Column(name = "allocated_on", nullable = false)
    private LocalDate allocatedOn;

    @Column(name = "vacated_on")
    private LocalDate vacatedOn;

    @Column(length = 500)
    private String remarks;

    /** False once the student has vacated; history is kept rather than deleted. */
    @Builder.Default
    private boolean active = true;
}
