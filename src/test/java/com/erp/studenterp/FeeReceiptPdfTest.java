package com.erp.studenterp;

import com.erp.studenterp.dto.FeePaymentRequest;
import com.erp.studenterp.dto.FeePaymentResponse;
import com.erp.studenterp.dto.FeeStructureRequest;
import com.erp.studenterp.dto.FeeStructureResponse;
import com.erp.studenterp.entity.*;
import com.erp.studenterp.repository.*;
import com.erp.studenterp.service.FeeReceiptPdfService;
import com.erp.studenterp.service.FeeService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The receipt PDF walks payment -> student fee -> student -> course, every hop
 * LAZY, and spring.jpa.open-in-view is false.  This pins that the whole chain
 * is still reachable when the PDF is rendered.
 */
@SpringBootTest
class FeeReceiptPdfTest {

    @Autowired FeeService feeService;
    @Autowired FeeReceiptPdfService feeReceiptPdfService;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired CourseRepository courseRepository;
    @Autowired StudentRepository studentRepository;

    private Course course;
    private Department department;

    @BeforeEach
    void seed() {
        department = departmentRepository.findByDepartmentName("Receipt Test Department")
                .orElseGet(() -> {
                    Department fresh = new Department();
                    fresh.setDepartmentName("Receipt Test Department");
                    fresh.setDepartmentCode("RTD");
                    return departmentRepository.save(fresh);
                });

        course = courseRepository.findByCourseName("Receipt Test Course")
                .orElseGet(() -> {
                    Course fresh = new Course();
                    fresh.setCourseName("Receipt Test Course");
                    fresh.setDuration(3);
                    return courseRepository.save(fresh);
                });
    }

    @Test
    void rendersAReceiptForARecordedPayment() {
        FeeStructureRequest structureRequest = new FeeStructureRequest();
        structureRequest.setCourseId(course.getId());
        structureRequest.setSemester(1);
        structureRequest.setFeeType(FeeType.TUITION);
        structureRequest.setAmount(new BigDecimal("20000.00"));
        structureRequest.setAcademicYear("2025-2026");
        FeeStructureResponse structure = feeService.createFeeStructure(structureRequest);

        Student student = new Student();
        student.setFirstName("Receipt");
        student.setLastName("Tester");
        student.setEmail("receipt." + System.nanoTime() + "@studenterp.local");
        student.setEnrollmentNumber("RCP" + System.nanoTime());
        student.setActive(true);
        student.setDepartment(department);
        student.setCourse(course);
        student.setSemester(1);
        student = studentRepository.save(student);

        var fee = feeService.assignFee(student.getId(), structure.getId());

        FeePaymentRequest payment = new FeePaymentRequest();
        payment.setAmount(new BigDecimal("5000.00"));
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setRemarks("Audit check");
        FeePaymentResponse recorded = feeService.makePayment(fee.getId(), payment);

        byte[] pdf = feeReceiptPdfService.generateReceipt(recorded.getId());

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 5, java.nio.charset.StandardCharsets.ISO_8859_1))
                .isEqualTo("%PDF-");
    }
}
