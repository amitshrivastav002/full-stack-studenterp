package com.erp.studenterp;

import com.erp.studenterp.entity.*;
import com.erp.studenterp.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

/**
 * Covers the webhook path that exists precisely because the browser callback is
 * unreliable: a signed delivery must credit the fee, an unsigned one must not,
 * and a repeat delivery must not credit it twice.
 */
@SpringBootTest(webEnvironment = RANDOM_PORT)
class RazorpayWebhookTest {

    private static final String SECRET = "TestWebhookSecret123";

    @LocalServerPort private int port;

    @Autowired private StudentRepository studentRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private FeeStructureRepository feeStructureRepository;
    @Autowired private StudentFeeRepository studentFeeRepository;
    @Autowired private RazorpayOrderRepository razorpayOrderRepository;
    @Autowired private FeePaymentRepository feePaymentRepository;

    private final HttpClient http = HttpClient.newHttpClient();

    private StudentFee fee;

    @BeforeEach
    void seedFee() {
        Department department = new Department();
        department.setDepartmentName("Webhook Dept " + System.nanoTime());
        department.setDepartmentCode("WH" + (System.nanoTime() % 100000));
        departmentRepository.save(department);

        Course course = new Course();
        course.setCourseName("Webhook Course");
        course.setDuration(4);
        course.setFees(50000.0);
        courseRepository.save(course);

        Student student = new Student();
        student.setFirstName("Webhook");
        student.setLastName("Student");
        student.setEmail("webhook." + System.nanoTime() + "@studenterp.local");
        student.setEnrollmentNumber("WH" + System.nanoTime());
        student.setDepartment(department);
        student.setCourse(course);
        student.setSemester(1);
        student.setActive(true);
        studentRepository.save(student);

        FeeStructure structure = feeStructureRepository.save(FeeStructure.builder()
                .course(course).semester(1).feeType(FeeType.TUITION)
                .amount(new BigDecimal("5000.00")).academicYear("2025-26")
                .active(true).build());

        fee = studentFeeRepository.save(StudentFee.builder()
                .student(student).feeStructure(structure)
                .totalAmount(new BigDecimal("5000.00"))
                .paidAmount(BigDecimal.ZERO)
                .dueAmount(new BigDecimal("5000.00"))
                .status(PaymentStatus.PENDING).build());
    }

    private RazorpayOrder openOrder(String orderId, String amount) {
        return razorpayOrderRepository.save(RazorpayOrder.builder()
                .studentFee(fee).razorpayOrderId(orderId)
                .amount(new BigDecimal(amount)).completed(false).build());
    }

    private String body(String orderId, String paymentId, String event) {
        return "{\"event\":\"" + event + "\",\"payload\":{\"payment\":{\"entity\":{"
                + "\"id\":\"" + paymentId + "\",\"order_id\":\"" + orderId + "\","
                + "\"amount\":500000,\"status\":\"captured\"}}}}";
    }

    private String sign(String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }

    private HttpResponse<String> post(String payload, String signature) throws Exception {
        HttpRequest.Builder request = HttpRequest
                .newBuilder(URI.create("http://localhost:" + port + "/api/webhooks/razorpay"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload));
        if (signature != null) request.header("X-Razorpay-Signature", signature);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    // ------------------------------------------------------------------ tests

    @Test
    void signedCaptureCreditsTheFee() throws Exception {
        String orderId = "order_signed_" + System.nanoTime();
        openOrder(orderId, "5000.00");
        String payload = body(orderId, "pay_signed_1", "payment.captured");

        HttpResponse<String> response = post(payload, sign(payload));

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isEqualTo("settled");

        StudentFee updated = studentFeeRepository.findById(fee.getId()).orElseThrow();
        assertThat(updated.getPaidAmount()).isEqualByComparingTo("5000.00");
        assertThat(updated.getDueAmount()).isEqualByComparingTo("0.00");
        assertThat(updated.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(razorpayOrderRepository.findByRazorpayOrderId(orderId)
                .orElseThrow().isCompleted()).isTrue();
    }

    @Test
    void forgedSignatureIsRejectedAndCreditsNothing() throws Exception {
        String orderId = "order_forged_" + System.nanoTime();
        openOrder(orderId, "5000.00");
        String payload = body(orderId, "pay_forged_1", "payment.captured");

        HttpResponse<String> response = post(payload, "deadbeef");

        assertThat(response.statusCode()).isEqualTo(400);
        StudentFee untouched = studentFeeRepository.findById(fee.getId()).orElseThrow();
        assertThat(untouched.getPaidAmount()).isEqualByComparingTo("0.00");
        assertThat(untouched.getStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void missingSignatureIsRejected() throws Exception {
        String orderId = "order_nosig_" + System.nanoTime();
        openOrder(orderId, "5000.00");
        String payload = body(orderId, "pay_nosig_1", "payment.captured");

        assertThat(post(payload, null).statusCode()).isEqualTo(400);
        assertThat(studentFeeRepository.findById(fee.getId()).orElseThrow()
                .getPaidAmount()).isEqualByComparingTo("0.00");
    }

    /** Razorpay retries until it sees a 2xx, so this is the case that matters. */
    @Test
    void repeatDeliveryCreditsTheFeeOnlyOnce() throws Exception {
        String orderId = "order_retry_" + System.nanoTime();
        openOrder(orderId, "5000.00");
        String payload = body(orderId, "pay_retry_1", "payment.captured");
        String signature = sign(payload);

        assertThat(post(payload, signature).body()).isEqualTo("settled");
        HttpResponse<String> second = post(payload, signature);

        assertThat(second.statusCode()).isEqualTo(200);
        assertThat(second.body()).isEqualTo("already-settled");

        StudentFee updated = studentFeeRepository.findById(fee.getId()).orElseThrow();
        assertThat(updated.getPaidAmount()).isEqualByComparingTo("5000.00");
        assertThat(feePaymentRepository.findAll().stream()
                .filter(p -> "pay_retry_1".equals(p.getTransactionId()))
                .count()).isEqualTo(1);
    }

    @Test
    void unknownOrderIsAcknowledgedWithoutCrediting() throws Exception {
        String payload = body("order_never_opened", "pay_unknown_1", "payment.captured");

        HttpResponse<String> response = post(payload, sign(payload));

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isEqualTo("unknown-order");
    }

    @Test
    void unrelatedEventIsIgnored() throws Exception {
        String orderId = "order_other_" + System.nanoTime();
        openOrder(orderId, "5000.00");
        String payload = body(orderId, "pay_other_1", "payment.failed");

        HttpResponse<String> response = post(payload, sign(payload));

        assertThat(response.body()).isEqualTo("ignored");
        assertThat(studentFeeRepository.findById(fee.getId()).orElseThrow()
                .getPaidAmount()).isEqualByComparingTo("0.00");
    }
}
