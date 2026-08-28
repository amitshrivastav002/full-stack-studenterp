package com.erp.studenterp.repository;

import com.erp.studenterp.entity.FeePayment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeePaymentRepository
        extends JpaRepository<FeePayment, Long> {

    List<FeePayment>
    findByStudentFeeIdOrderByPaymentDateDesc(
            Long studentFeeId
    );
}