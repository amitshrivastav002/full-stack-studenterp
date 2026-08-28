package com.erp.studenterp.controller;

import com.erp.studenterp.service.RazorpayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Razorpay's server-to-server callback. Unauthenticated by necessity - Razorpay
 * holds no JWT - so the shared webhook secret in the signature header is the
 * only thing that makes a request trustworthy.
 */
@RestController
@RequestMapping("/api/webhooks/razorpay")
@RequiredArgsConstructor
@Slf4j
public class RazorpayWebhookController {
    private final RazorpayService razorpayService;

    /**
     * Takes the body as a String rather than a DTO on purpose: the signature is
     * over the exact bytes sent, so Jackson must not round-trip them first.
     */
    @PostMapping
    public ResponseEntity<String> receive(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        try {
            String outcome = razorpayService.handleWebhook(rawBody, signature);
            log.info("Razorpay webhook handled: {}", outcome);
            return ResponseEntity.ok(outcome);
        } catch (Exception e) {
            // 4xx tells Razorpay not to retry. A bad signature is never going to
            // become valid, and retrying it just repeats the noise.
            log.warn("Razorpay webhook rejected: {}", e.getMessage());
            return ResponseEntity.badRequest().body("rejected");
        }
    }
}
