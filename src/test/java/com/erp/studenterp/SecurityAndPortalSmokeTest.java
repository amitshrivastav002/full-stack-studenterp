package com.erp.studenterp;

import com.erp.studenterp.entity.Role;
import com.erp.studenterp.entity.User;
import com.erp.studenterp.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

/**
 * End-to-end checks over real HTTP for the things that are easy to get wrong:
 * who may sign in, who may reach which prefix, and whether the error body has
 * the shape the browser client parses.
 */
@SpringBootTest(webEnvironment = RANDOM_PORT)
class SecurityAndPortalSmokeTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "smoke.admin@studenterp.local";
    private static final String STUDENT_EMAIL = "smoke.student@studenterp.local";
    private static final String PASSWORD = "SmokeTest123";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @BeforeEach
    void seedAccounts() {
        createIfAbsent(ADMIN_EMAIL, Role.ADMIN);
        createIfAbsent(STUDENT_EMAIL, Role.STUDENT);
    }

    private void createIfAbsent(String email, Role role) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        User user = new User();
        user.setFullName(role + " Smoke");
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(PASSWORD));
        user.setRole(role);
        userRepository.save(user);
    }

    // ------------------------------------------------------------- plumbing

    private HttpResponse<String> get(String path, String token) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .GET();

        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }

        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> postJson(String path, String json) throws Exception {
        return postJson(path, json, null);
    }

    private HttpResponse<String> postJson(String path, String json, String token)
            throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json));

        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }

        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String login(String email, String password) throws Exception {
        HttpResponse<String> response = postJson("/api/auth/login",
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}");

        assertThat(response.statusCode()).isEqualTo(200);

        // Small enough to read straight out of the body rather than pulling in a parser.
        return response.body().replaceAll(".*\"token\"\\s*:\\s*\"([^\"]+)\".*", "$1");
    }

    // ----------------------------------------------------------------- tests

    @Test
    void loginReturnsTokenRoleAndName() throws Exception {
        HttpResponse<String> response = postJson("/api/auth/login",
                "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + PASSWORD + "\"}");

        assertThat(response.statusCode()).isEqualTo(200);
        // The client routes on role, so a null here would strand the user.
        assertThat(response.body()).contains("\"token\"", "\"fullName\"", "\"role\":\"ADMIN\"");
    }

    @Test
    void wrongPasswordIsUnauthorisedWithAReadableMessage() throws Exception {
        HttpResponse<String> response = postJson("/api/auth/login",
                "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"not-the-password\"}");

        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.body()).contains("\"message\"");
    }

    @Test
    void registrationIsClosedToAnonymousCallers() throws Exception {
        HttpResponse<String> response = postJson("/api/auth/register",
                "{\"fullName\":\"Intruder\",\"email\":\"intruder@example.com\","
                        + "\"password\":\"password123\",\"role\":\"ADMIN\"}");

        assertThat(response.statusCode()).isIn(401, 403);
        assertThat(userRepository.existsByEmail("intruder@example.com")).isFalse();
    }

    @Test
    void studentsCannotReachStudentMasterData() throws Exception {
        assertThat(get("/api/students", login(STUDENT_EMAIL, PASSWORD)).statusCode())
                .isEqualTo(403);
    }

    @Test
    void studentsCannotReachAdminEndpoints() throws Exception {
        assertThat(get("/api/admin/notices", login(STUDENT_EMAIL, PASSWORD)).statusCode())
                .isEqualTo(403);
    }

    @Test
    void adminReachesTheirOwnDashboardAndNotices() throws Exception {
        String token = login(ADMIN_EMAIL, PASSWORD);

        assertThat(get("/api/admin/dashboard", token).statusCode()).isEqualTo(200);
        assertThat(get("/api/admin/notices", token).statusCode()).isEqualTo(200);
    }

    @Test
    void everySignedInRoleCanReadItsOwnProfile() throws Exception {
        HttpResponse<String> response = get("/api/me", login(STUDENT_EMAIL, PASSWORD));

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"role\":\"STUDENT\"");
    }

    @Test
    void onlyStudentsCanReachTheirOwnFeeCheckout() throws Exception {
        // A fee ID is enough to try: authorisation has to stop the call before
        // the body is ever looked at.
        String body = "{\"studentFeeId\":1,\"amount\":100}";

        assertThat(postJson("/api/student/fees/razorpay/orders", body,
                login(ADMIN_EMAIL, PASSWORD)).statusCode()).isEqualTo(403);

        assertThat(postJson("/api/student/fees/razorpay/orders", body, null)
                .statusCode()).isEqualTo(401);

        assertThat(postJson("/api/student/fees/razorpay/verify", "{}", null)
                .statusCode()).isEqualTo(401);
    }

    @Test
    void feeReceiptsAreClosedToNonStudents() throws Exception {
        String adminToken = login(ADMIN_EMAIL, PASSWORD);

        // The PDF route matters most: it renders from a raw payment ID, so the
        // role gate is the first thing standing between it and the wrong reader.
        assertThat(get("/api/student/fees/payments/1/receipt", adminToken).statusCode())
                .isEqualTo(403);
        assertThat(get("/api/student/fees/payments/1/receipt/pdf", adminToken).statusCode())
                .isEqualTo(403);
        assertThat(get("/api/student/fees/payments/1/receipt/pdf", null).statusCode())
                .isEqualTo(401);
    }

    @Test
    void everySignedInRoleReachesItsOwnPhoto() throws Exception {
        // 404 rather than 403 is the point: the admin has no photo yet, but the
        // route is theirs to use. A 403 here would mean self-service is closed to
        // roles that own no student or faculty record.
        assertThat(get("/api/me/photo", login(ADMIN_EMAIL, PASSWORD)).statusCode())
                .isEqualTo(404);
        assertThat(get("/api/me/photo", login(STUDENT_EMAIL, PASSWORD)).statusCode())
                .isEqualTo(404);

        assertThat(get("/api/me/photo", null).statusCode()).isEqualTo(401);
    }

    @Test
    void publicSignUpAlwaysCreatesAStudent() throws Exception {
        String email = "smoke.signup@studenterp.local";
        userRepository.findByEmail(email).ifPresent(userRepository::delete);

        // The body asks for ADMIN. The endpoint is unauthenticated, so honouring
        // that would hand anybody the whole ERP.
        HttpResponse<String> created = postJson("/api/auth/signup",
                "{\"fullName\":\"Self Served\",\"email\":\"" + email + "\","
                        + "\"password\":\"SignUpTest123\",\"role\":\"ADMIN\"}");

        assertThat(created.statusCode()).isEqualTo(201);

        HttpResponse<String> signedIn = postJson("/api/auth/login",
                "{\"email\":\"" + email + "\",\"password\":\"SignUpTest123\"}");

        assertThat(signedIn.statusCode()).isEqualTo(200);
        assertThat(signedIn.body()).contains("\"role\":\"STUDENT\"");
        assertThat(signedIn.body()).doesNotContain("ADMIN");

        // And the role-bearing admin route is still closed to that account.
        String token = login(email, "SignUpTest123");
        assertThat(postJson("/api/auth/register",
                "{\"fullName\":\"Escalated\",\"email\":\"escalated@example.com\","
                        + "\"password\":\"password123\",\"role\":\"ADMIN\"}", token)
                .statusCode()).isEqualTo(403);
        assertThat(userRepository.existsByEmail("escalated@example.com")).isFalse();
    }

    @Test
    void anonymousRequestsAreRejectedAsJson() throws Exception {
        HttpResponse<String> response = get("/api/me", null);

        assertThat(response.statusCode()).isEqualTo(401);
        // The browser client reads `message`; an empty body would look like a
        // network failure rather than an expired session.
        assertThat(response.body()).contains("\"message\"");
    }
}
