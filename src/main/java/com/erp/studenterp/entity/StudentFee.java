package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "student_fees",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_student_fee_structure",
                columnNames = {"student_id", "fee_structure_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentFee extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "student_id",
            nullable = false
    )
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "fee_structure_id",
            nullable = false
    )
    private FeeStructure feeStructure;

    @Column(
            name = "total_amount",
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal totalAmount;

    @Column(
            name = "paid_amount",
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(
            name = "due_amount",
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal dueAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;
}
