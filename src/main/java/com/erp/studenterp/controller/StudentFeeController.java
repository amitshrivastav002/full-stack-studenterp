package com.erp.studenterp.controller;

import com.erp.studenterp.dto.FeePaymentResponse;
import com.erp.studenterp.dto.FeeReceiptResponse;
import com.erp.studenterp.dto.RazorpayOrderRequest;
import com.erp.studenterp.dto.RazorpayOrderResponse;
import com.erp.studenterp.dto.StudentFeeDashboardResponse;
import com.erp.studenterp.dto.StudentRazorpayVerificationRequest;
import com.erp.studenterp.service.FeeReceiptPdfService;
import com.erp.studenterp.service.FeeService;
import com.erp.studenterp.service.RazorpayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student/fees")
@RequiredArgsConstructor
public class StudentFeeController {
    private final FeeService feeService;
    private final RazorpayService razorpayService;
    private final FeeReceiptPdfService feeReceiptPdfService;

    @GetMapping("/dashboard")
    public StudentFeeDashboardResponse getDashboard(Authentication authentication) {
        return feeService.getStudentFeeDashboardByEmail(authentication.getName());
    }

    /**
     * Opens a Razorpay order for one of the caller's own fees. The service checks
     * the fee against the authenticated student, so the ID in the body is never
     * trusted on its own.
     */
    @PostMapping("/razorpay/orders")
    public RazorpayOrderResponse createOrder(
            @Valid @RequestBody RazorpayOrderRequest request,
            Authentication authentication) {
        return razorpayService.createOrderForStudent(authentication.getName(), request);
    }

    @PostMapping("/razorpay/verify")
    public FeePaymentResponse verifyPayment(
            @Valid @RequestBody StudentRazorpayVerificationRequest request,
            Authentication authentication) {
        return razorpayService.verifyAndRecordStudentPayment(
                authentication.getName(), request);
    }

    /** Every payment settled against one of the caller's own fees. */
    @GetMapping("/student-fees/{studentFeeId}/payments")
    public List<FeePaymentResponse> getPayments(
            @PathVariable Long studentFeeId,
            Authentication authentication) {
        return feeService.getPaymentHistoryForStudent(
                authentication.getName(), studentFeeId);
    }

    @GetMapping("/payments/{paymentId}/receipt")
    public FeeReceiptResponse getReceipt(
            @PathVariable Long paymentId,
            Authentication authentication) {
        return feeService.getReceiptForStudent(authentication.getName(), paymentId);
    }

    @GetMapping("/payments/{paymentId}/receipt/pdf")
    public ResponseEntity<byte[]> downloadReceipt(
            @PathVariable Long paymentId,
            Authentication authentication) {

        // Checked before a single byte is rendered: the PDF service takes a raw
        // payment ID and has no idea who is asking for it.
        feeService.requireOwnedPayment(authentication.getName(), paymentId);

        byte[] pdf = feeReceiptPdfService.generateReceipt(paymentId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=fee-receipt-" + paymentId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
