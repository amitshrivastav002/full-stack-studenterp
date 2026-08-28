package com.erp.studenterp.repository;

import com.erp.studenterp.entity.RazorpayOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RazorpayOrderRepository extends JpaRepository<RazorpayOrder, Long> {
    Optional<RazorpayOrder> findByRazorpayOrderId(String razorpayOrderId);

    /**
     * Same lookup, but holds a row lock until the surrounding transaction ends.
     * The browser callback and Razorpay's webhook routinely report the same
     * payment at the same moment; without the lock both can read completed=false
     * and credit the fee twice.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from RazorpayOrder o where o.razorpayOrderId = :razorpayOrderId")
    Optional<RazorpayOrder> lockByRazorpayOrderId(@Param("razorpayOrderId") String razorpayOrderId);

    List<RazorpayOrder> findAllByOrderByCreatedAtDesc();
}
