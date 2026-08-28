package com.erp.studenterp.controller;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.service.RazorpayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/fees/razorpay")
@RequiredArgsConstructor
public class RazorpayController {
    private final RazorpayService razorpayService;

    /** Management view: every order with its settlement state. */
    @GetMapping("/orders")
    public List<RazorpayOrderSummaryResponse> listOrders() {
        return razorpayService.listOrders();
    }

    /** Whether online payment is switched on, plus reconciliation totals. */
    @GetMapping("/status")
    public RazorpayStatusResponse status() {
        return razorpayService.status();
    }

    @PostMapping("/orders")
    public RazorpayOrderResponse createOrder(@Valid @RequestBody RazorpayOrderRequest request) {
        return razorpayService.createOrder(request);
    }

    @PostMapping("/verify")
    public FeePaymentResponse verifyPayment(
            @Valid @RequestBody RazorpayPaymentVerificationRequest request) {
        return razorpayService.verifyAndRecordPayment(request);
    }
}
