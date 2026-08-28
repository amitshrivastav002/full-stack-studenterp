package com.erp.studenterp.repository;

import com.erp.studenterp.entity.StudentFee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface StudentFeeRepository
        extends JpaRepository<StudentFee, Long> {

    List<StudentFee>
    findByStudentId(Long studentId);

    Optional<StudentFee>
    findByIdAndStudentId(
            Long id,
            Long studentId
    );

    /** Billed, collected and outstanding totals across every assigned fee. */
    @Query("SELECT COALESCE(SUM(f.totalAmount), 0) FROM StudentFee f")
    BigDecimal sumBilled();

    @Query("SELECT COALESCE(SUM(f.paidAmount), 0) FROM StudentFee f")
    BigDecimal sumCollected();

    @Query("SELECT COALESCE(SUM(f.dueAmount), 0) FROM StudentFee f")
    BigDecimal sumOutstanding();

    @Query("""
            SELECT COALESCE(SUM(f.dueAmount), 0)
            FROM StudentFee f
            WHERE f.student.id = :studentId
            """)
    BigDecimal sumDueForStudent(@Param("studentId") Long studentId);
}
