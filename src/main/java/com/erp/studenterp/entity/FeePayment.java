package com.erp.studenterp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "fee_payments"
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeePayment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "student_fee_id",
            nullable = false
    )
    private StudentFee studentFee;

    @Column(
            name = "transaction_id",
            nullable = false,
            unique = true
    )
    private String transactionId;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal amount;

    @Column(
            name = "payment_date",
            nullable = false
    )
    private LocalDateTime paymentDate;

    @Enumerated(EnumType.STRING)
@Column(
        name = "payment_method",
        nullable = false
)
private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    private String remarks;
}