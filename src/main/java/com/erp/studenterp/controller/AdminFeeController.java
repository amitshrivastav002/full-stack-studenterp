package com.erp.studenterp.controller;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.service.FeeReceiptPdfService;
import com.erp.studenterp.service.FeeService;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;


import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/fees")
@RequiredArgsConstructor
public class AdminFeeController {

    private final FeeService feeService;

    private final FeeReceiptPdfService feeReceiptPdfService;


    // Create fee structure

    @PostMapping("/structures")
    public FeeStructureResponse createFeeStructure(
            @Valid
            @RequestBody FeeStructureRequest request) {

        return feeService
                .createFeeStructure(request);
    }


    // Get fee structures

    @GetMapping("/structures")
    public List<FeeStructureResponse>
    getFeeStructures() {

        return feeService
                .getFeeStructures();
    }


    // Assign fee to student

    @PostMapping(
            "/students/{studentId}/assign"
    )
    public StudentFeeResponse assignFee(
            @PathVariable Long studentId,
            @RequestParam Long feeStructureId) {

        return feeService.assignFee(
                studentId,
                feeStructureId
        );
    }


    // Get student fees

    @GetMapping(
            "/students/{studentId}"
    )
    public List<StudentFeeResponse>
    getStudentFees(
            @PathVariable Long studentId) {

        return feeService
                .getStudentFees(studentId);
    }
    @PostMapping(
        "/student-fees/{studentFeeId}/payments"
)
public FeePaymentResponse makePayment(

        @PathVariable Long studentFeeId,

        @Valid
        @RequestBody FeePaymentRequest request) {

    return feeService.makePayment(
            studentFeeId,
            request
    );
}
@GetMapping(
        "/student-fees/{studentFeeId}/payments"
)
public List<FeePaymentResponse>
getPaymentHistory(
        @PathVariable Long studentFeeId) {

    return feeService
            .getPaymentHistory(
                    studentFeeId
            );
}
@GetMapping(
        "/payments/{paymentId}/receipt"
)
public FeeReceiptResponse getReceipt(
        @PathVariable Long paymentId) {

    return feeService.getReceipt(
            paymentId
    );
}
@GetMapping(
        "/payments/{paymentId}/receipt/pdf"
)
public ResponseEntity<byte[]> downloadReceipt(
        @PathVariable Long paymentId) {

    byte[] pdf =
            feeReceiptPdfService
                    .generateReceipt(
                            paymentId
                    );

    return ResponseEntity.ok()
            .header(
                    HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=fee-receipt-"
                            + paymentId
                            + ".pdf"
            )
            .contentType(
                    MediaType.APPLICATION_PDF
            )
            .body(pdf);
}
    
}