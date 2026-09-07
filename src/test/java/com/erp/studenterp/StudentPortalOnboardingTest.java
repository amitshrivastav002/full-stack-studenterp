package com.erp.studenterp;

import com.erp.studenterp.entity.Course;
import com.erp.studenterp.entity.Department;
import com.erp.studenterp.entity.Role;
import com.erp.studenterp.entity.User;
import com.erp.studenterp.repository.CourseRepository;
import com.erp.studenterp.repository.DepartmentRepository;
import com.erp.studenterp.repository.StudentRepository;
import com.erp.studenterp.repository.UserRepository;

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
 * Proves the full onboarding path end to end: an admin creates the Student
 * master record (with a fee auto-assigned), the same person self-signs-up
 * with the matching email, and the portal then shows that student their own
 * data and fee - without a duplicate Student record being created.
 */
@SpringBootTest(webEnvironment = RANDOM_PORT)
class StudentPortalOnboardingTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "onboarding.admin@studenterp.local";
    private static final String ADMIN_PASSWORD = "OnboardTest123";
    private static final String STUDENT_EMAIL = "onboarding.student@studenterp.local";
    private static final String STUDENT_PASSWORD = "OnboardTest123";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Test
    void adminCreatedStudentCanSelfSignUpAndSeeTheirDataAndFee() throws Exception {
        cleanUp();

        String adminToken = login(seedAdmin(), ADMIN_PASSWORD);

        Course course = courseRepository.findByCourseName("B.Tech Computer Science & Engineering")
                .orElseThrow();
        Department department = departmentRepository.findByDepartmentName("Computer Science & Engineering")
                .orElseThrow();

        // Admin creates the fee structure and the Student master record.
        HttpResponse<String> structure = postJson("/api/admin/fees/structures", """
                {"courseId":%d,"semester":5,"feeType":"TUITION","amount":50000,"academicYear":"2026-27"}
                """.formatted(course.getId()), adminToken);
        assertThat(structure.statusCode()).isEqualTo(200);

        HttpResponse<String> created = postJson("/api/students", """
                {"enrollmentNumber":"ONB2026001","firstName":"Onboard","lastName":"Student",
                 "email":"%s","mobileNumber":"9876543210","dateOfBirth":"2005-01-01","gender":"Female",
                 "semester":5,"section":"A","departmentId":%d,"courseId":%d}
                """.formatted(STUDENT_EMAIL, department.getId(), course.getId()), adminToken);
        assertThat(created.statusCode()).isEqualTo(200);
        assertThat(studentRepository.count()).isPositive();

        // The student signs up themselves, using the same email.
        HttpResponse<String> signedUp = postJson("/api/auth/signup", """
                {"fullName":"Onboard Student","email":"%s","password":"%s","role":"STUDENT"}
                """.formatted(STUDENT_EMAIL, STUDENT_PASSWORD));
        assertThat(signedUp.statusCode()).isEqualTo(201);

        // Signing up must not duplicate the admin-created Student record.
        assertThat(studentRepository.findAll().stream()
                .filter(s -> STUDENT_EMAIL.equals(s.getEmail())))
                .hasSize(1);

        String studentToken = login(STUDENT_EMAIL, STUDENT_PASSWORD);

        assertThat(get("/api/student/dashboard", studentToken).statusCode()).isEqualTo(200);

        HttpResponse<String> feeDashboard = get("/api/student/fees/dashboard", studentToken);
        assertThat(feeDashboard.statusCode()).isEqualTo(200);
        // The fee auto-assigned at Student-creation time must show up here.
        assertThat(feeDashboard.body()).contains("TUITION");
    }

    // ------------------------------------------------------------- plumbing

    private void cleanUp() {
        studentRepository.findByEmailAndActiveTrue(STUDENT_EMAIL)
                .ifPresent(studentRepository::delete);
        userRepository.findByEmail(STUDENT_EMAIL).ifPresent(userRepository::delete);
        userRepository.findByEmail(ADMIN_EMAIL).ifPresent(userRepository::delete);
    }

    private String seedAdmin() {
        User admin = new User();
        admin.setFullName("Onboarding Admin");
        admin.setEmail(ADMIN_EMAIL);
        admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
        return ADMIN_EMAIL;
    }

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

    private HttpResponse<String> postJson(String path, String json, String token) throws Exception {
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
        return response.body().replaceAll(".*\"token\"\\s*:\\s*\"([^\"]+)\".*", "$1");
    }
}
