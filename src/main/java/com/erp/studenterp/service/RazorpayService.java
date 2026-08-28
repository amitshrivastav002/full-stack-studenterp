package com.erp.studenterp.service;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.*;
import com.erp.studenterp.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RazorpayService {
    private final StudentFeeRepository studentFeeRepository;
    private final FeePaymentRepository feePaymentRepository;
    private final RazorpayOrderRepository razorpayOrderRepository;
    private final StudentRepository studentRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${razorpay.key-id:}") private String keyId;
    @Value("${razorpay.key-secret:}") private String keySecret;
    /** Set in the Razorpay dashboard when the webhook is created. Not the API secret. */
    @Value("${razorpay.webhook-secret:}") private String webhookSecret;

    public RazorpayOrderResponse createOrder(RazorpayOrderRequest request) {
        requireConfiguration();
        return openOrder(findFee(request.getStudentFeeId()), request.getAmount());
    }

    /**
     * Same as {@link #createOrder} but refuses a fee that does not belong to the
     * signed-in student, so a guessed studentFeeId cannot open an order against
     * somebody else's fee.
     */
    public RazorpayOrderResponse createOrderForStudent(
            String email, RazorpayOrderRequest request) {
        requireConfiguration();
        StudentFee fee = findFee(request.getStudentFeeId());
        requireOwnership(fee, email);
        return openOrder(fee, request.getAmount());
    }

    @Transactional
    public FeePaymentResponse verifyAndRecordPayment(RazorpayPaymentVerificationRequest request) {
        requireConfiguration();
        RazorpayOrder order = findOpenOrder(request.getRazorpayOrderId());
        requireValidSignature(request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(), request.getRazorpaySignature());
        return recordPayment(order, request.getRazorpayPaymentId(),
                request.getPaymentMethod(), request.getRemarks());
    }

    /**
     * Settles a checkout the student completed themselves. The order has to belong
     * to them, and the money is always recorded as {@link PaymentMethod#ONLINE}.
     */
    @Transactional
    public FeePaymentResponse verifyAndRecordStudentPayment(
            String email, StudentRazorpayVerificationRequest request) {
        requireConfiguration();
        RazorpayOrder order = findOpenOrder(request.getRazorpayOrderId());
        requireOwnership(order.getStudentFee(), email);
        requireValidSignature(request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(), request.getRazorpaySignature());
        return recordPayment(order, request.getRazorpayPaymentId(),
                PaymentMethod.ONLINE, request.getRemarks());
    }

    // -------------------------------------------------------------- webhook

    /**
     * Settles a payment straight from Razorpay's server-to-server callback, so a
     * fee is still credited when the student's browser never makes it back from
     * checkout. Razorpay retries a webhook until it gets a 2xx, so every branch
     * here is idempotent and a duplicate delivery is a no-op.
     *
     * @param rawBody the exact bytes Razorpay signed - reserialising the JSON
     *                first would change the digest and fail every time
     */
    @Transactional
    public String handleWebhook(String rawBody, String signature) {
        if (webhookSecret.isBlank()) {
            throw new RuntimeException("Razorpay webhook is not configured");
        }
        if (!matchesHmac(rawBody, webhookSecret, signature)) {
            throw new RuntimeException("Invalid Razorpay webhook signature");
        }

        JsonNode event = parse(rawBody);
        if (!"payment.captured".equals(event.path("event").asText())) {
            return "ignored";
        }

        JsonNode entity = event.path("payload").path("payment").path("entity");
        String orderId = entity.path("order_id").asText();
        String paymentId = entity.path("id").asText();
        if (orderId.isBlank() || paymentId.isBlank()) return "ignored";

        // An order we never opened: acknowledge it so Razorpay stops retrying,
        // but credit nothing.
        RazorpayOrder order = razorpayOrderRepository.lockByRazorpayOrderId(orderId)
                .orElse(null);
        if (order == null) return "unknown-order";

        // The browser callback already settled it, or this delivery is a retry.
        if (order.isCompleted()) return "already-settled";

        recordPayment(order, paymentId, PaymentMethod.ONLINE,
                "Settled automatically by Razorpay webhook");
        return "settled";
    }

    private JsonNode parse(String body) {
        try {
            return objectMapper.readTree(body);
        } catch (Exception e) {
            throw new RuntimeException("Unreadable Razorpay webhook payload", e);
        }
    }

    // ------------------------------------------------------- management views

    /** Every order the office can reconcile against, newest first. */
    @Transactional(readOnly = true)
    public List<RazorpayOrderSummaryResponse> listOrders() {
        return razorpayOrderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toSummary).toList();
    }

    /**
     * Read-only health and totals for the payments screen.  Deliberately never
     * returns the secret, and only the tail of the key id.
     */
    @Transactional(readOnly = true)
    public RazorpayStatusResponse status() {

        List<RazorpayOrder> orders = razorpayOrderRepository.findAll();

        BigDecimal collected = orders.stream().filter(RazorpayOrder::isCompleted)
                .map(RazorpayOrder::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pending = orders.stream().filter(order -> !order.isCompleted())
                .map(RazorpayOrder::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long completed = orders.stream().filter(RazorpayOrder::isCompleted).count();

        return RazorpayStatusResponse.builder()
                .configured(!keyId.isBlank() && !keySecret.isBlank())
                .keyIdHint(keyId.isBlank() || keyId.length() < 4
                        ? null : "..." + keyId.substring(keyId.length() - 4))
                .totalOrders(orders.size())
                .completedOrders(completed)
                .pendingOrders(orders.size() - completed)
                .collectedAmount(collected)
                .pendingAmount(pending)
                .build();
    }

    private RazorpayOrderSummaryResponse toSummary(RazorpayOrder order) {
        StudentFee fee = order.getStudentFee();
        Student student = fee.getStudent();
        String name = student.getFirstName()
                + (student.getLastName() == null || student.getLastName().isBlank()
                        ? "" : " " + student.getLastName());

        return RazorpayOrderSummaryResponse.builder()
                .id(order.getId())
                .razorpayOrderId(order.getRazorpayOrderId())
                .amount(order.getAmount())
                .completed(order.isCompleted())
                .createdAt(order.getCreatedAt())
                .studentFeeId(fee.getId())
                .studentId(student.getId())
                .enrollmentNumber(student.getEnrollmentNumber())
                .studentName(name)
                .feeType(fee.getFeeStructure().getFeeType())
                .academicYear(fee.getFeeStructure().getAcademicYear())
                .build();
    }

    // ------------------------------------------------------------------- steps

    private RazorpayOrderResponse openOrder(StudentFee fee, BigDecimal amount) {
        if (amount.compareTo(fee.getDueAmount()) > 0) {
            throw new RuntimeException("Payment amount cannot be greater than due amount");
        }
        long paise = amount.movePointRight(2).longValueExact();
        JsonNode response = callRazorpay("{\"amount\":" + paise
                + ",\"currency\":\"INR\",\"receipt\":\"fee-" + fee.getId()
                + "-" + System.currentTimeMillis() + "\"}");
        String orderId = response.path("id").asText();
        if (orderId.isBlank()) throw new RuntimeException("Razorpay did not return an order ID");

        razorpayOrderRepository.save(RazorpayOrder.builder().studentFee(fee)
                .razorpayOrderId(orderId).amount(amount).completed(false).build());
        return RazorpayOrderResponse.builder().keyId(keyId).orderId(orderId)
                .amountInPaise(paise).currency("INR").studentFeeId(fee.getId()).build();
    }

    /**
     * Credits the order against its fee. The amount comes from the stored order
     * rather than from the request, so a client cannot inflate what it paid.
     */
    private FeePaymentResponse recordPayment(
            RazorpayOrder order, String paymentId, PaymentMethod method, String remarks) {
        StudentFee fee = order.getStudentFee();
        if (order.getAmount().compareTo(fee.getDueAmount()) > 0) {
            throw new RuntimeException("Payment amount cannot be greater than due amount");
        }
        BigDecimal paid = fee.getPaidAmount().add(order.getAmount());
        BigDecimal due = fee.getTotalAmount().subtract(paid);
        fee.setPaidAmount(paid); fee.setDueAmount(due);
        fee.setStatus(due.signum() == 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL);
        studentFeeRepository.save(fee);

        FeePayment payment = feePaymentRepository.save(FeePayment.builder().studentFee(fee)
                .transactionId(paymentId).amount(order.getAmount())
                .paymentDate(LocalDateTime.now()).paymentMethod(method)
                .status(PaymentStatus.PAID).remarks(remarks).build());
        order.setCompleted(true);
        razorpayOrderRepository.save(order);
        return FeePaymentResponse.builder().id(payment.getId()).studentFeeId(fee.getId())
                .studentId(fee.getStudent().getId()).enrollmentNumber(fee.getStudent().getEnrollmentNumber())
                .studentName(fee.getStudent().getFirstName() + (fee.getStudent().getLastName() == null ? "" : " " + fee.getStudent().getLastName()))
                .transactionId(payment.getTransactionId()).amount(payment.getAmount())
                .totalAmount(fee.getTotalAmount()).paidAmount(fee.getPaidAmount()).dueAmount(fee.getDueAmount())
                .paymentMethod(payment.getPaymentMethod().name()).paymentDate(payment.getPaymentDate())
                .status(payment.getStatus()).remarks(payment.getRemarks()).build();
    }

    // ------------------------------------------------------------------ guards

    private StudentFee findFee(Long studentFeeId) {
        return studentFeeRepository.findById(studentFeeId)
                .orElseThrow(() -> new RuntimeException("Student fee not found"));
    }

    private RazorpayOrder findOpenOrder(String razorpayOrderId) {
        RazorpayOrder order = razorpayOrderRepository.lockByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new RuntimeException("Razorpay order not found"));
        if (order.isCompleted()) {
            throw new RuntimeException("This Razorpay order has already been processed");
        }
        return order;
    }

    /**
     * Reports the same wording as an unknown fee on purpose: telling a student
     * that a fee exists but belongs to someone else would leak the ID space.
     */
    private void requireOwnership(StudentFee fee, String email) {
        Student student = studentRepository.findByEmailAndActiveTrue(email)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));
        if (!fee.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("Student fee not found");
        }
    }

    private void requireValidSignature(String orderId, String paymentId, String signature) {
        if (!isValidSignature(orderId, paymentId, signature)) {
            throw new RuntimeException("Invalid Razorpay payment signature");
        }
    }

    // ---------------------------------------------------------------- razorpay

    private JsonNode callRazorpay(String body) {
        try {
            String auth = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.razorpay.com/v1/orders"))
                    .header("Authorization", "Basic " + auth).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body)).build();
            HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("Razorpay order creation failed: " + response.body());
            }
            return objectMapper.readTree(response.body());
        } catch (Exception e) { throw new RuntimeException("Unable to create Razorpay order", e); }
    }

    private boolean isValidSignature(String orderId, String paymentId, String signature) {
        return matchesHmac(orderId + "|" + paymentId, keySecret, signature);
    }

    /** Constant-time compare of a HmacSHA256 hex digest, so a wrong signature leaks no timing. */
    private boolean matchesHmac(String payload, String secret, String signature) {
        if (signature == null || signature.isBlank()) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(
                    mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
            return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) { throw new RuntimeException("Unable to verify Razorpay payment", e); }
    }

    private void requireConfiguration() {
        if (keyId.isBlank() || keySecret.isBlank()) throw new RuntimeException("Razorpay is not configured");
    }
}
