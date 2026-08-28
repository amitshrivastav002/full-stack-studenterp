package com.erp.studenterp;

import com.erp.studenterp.dto.FeeStructureRequest;
import com.erp.studenterp.dto.FeeStructureResponse;
import com.erp.studenterp.entity.*;
import com.erp.studenterp.repository.*;
import com.erp.studenterp.service.FeeService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

/** Assigning a fee structure to a student. */
@SpringBootTest(webEnvironment = RANDOM_PORT)
class FeeAssignmentTest {

    @LocalServerPort int port;

    @Autowired FeeService feeService;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired CourseRepository courseRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired StudentFeeRepository studentFeeRepository;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "fee.admin@studenterp.local";
    private static final String PASSWORD = "FeeAdmin123";

    private final HttpClient http = HttpClient.newHttpClient();

    private Course course;
    private Course otherCourse;
    private Department department;

    @BeforeEach
    void seed() {
        department = departmentRepository.findByDepartmentName("Fee Test Department")
                .orElseGet(() -> {
                    Department fresh = new Department();
                    fresh.setDepartmentName("Fee Test Department");
                    fresh.setDepartmentCode("FTD");
                    return departmentRepository.save(fresh);
                });

        course = courseRepository.findByCourseName("Fee Test Course")
                .orElseGet(() -> {
                    Course fresh = new Course();
                    fresh.setCourseName("Fee Test Course");
                    fresh.setDuration(3);
                    return courseRepository.save(fresh);
                });

        otherCourse = courseRepository.findByCourseName("Fee Test Other Course")
                .orElseGet(() -> {
                    Course fresh = new Course();
                    fresh.setCourseName("Fee Test Other Course");
                    fresh.setDuration(3);
                    return courseRepository.save(fresh);
                });
    }

    /** Signs in as an admin and returns the bearer token. */
    private String adminToken() throws Exception {
        if (!userRepository.existsByEmail(ADMIN_EMAIL)) {
            User admin = new User();
            admin.setFullName("Fee Admin");
            admin.setEmail(ADMIN_EMAIL);
            admin.setPassword(passwordEncoder.encode(PASSWORD));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
        }

        HttpResponse<String> response = http.send(
                HttpRequest.newBuilder(URI.create(url("/api/auth/login")))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(
                                "{\"email\":\"" + ADMIN_EMAIL
                                        + "\",\"password\":\"" + PASSWORD + "\"}"))
                        .build(),
                HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        return response.body().replaceAll(".*\"token\"\\s*:\\s*\"([^\"]+)\".*", "$1");
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    /** The call the admin screen makes: no body, the structure in the query. */
    private HttpResponse<String> assignOverHttp(Long studentId, Long structureId)
            throws Exception {

        return http.send(
                HttpRequest.newBuilder(URI.create(url(
                        "/api/admin/fees/students/" + studentId
                                + "/assign?feeStructureId=" + structureId)))
                        .header("Authorization", "Bearer " + adminToken())
                        .POST(HttpRequest.BodyPublishers.noBody())
                        .build(),
                HttpResponse.BodyHandlers.ofString());
    }

    private FeeStructureResponse structure(Course forCourse, int semester) {
        FeeStructureRequest request = new FeeStructureRequest();
        request.setCourseId(forCourse.getId());
        request.setSemester(semester);
        request.setFeeType(FeeType.TUITION);
        request.setAmount(new BigDecimal("45000.00"));
        request.setAcademicYear("2025-2026");
        return feeService.createFeeStructure(request);
    }

    private Student student(Course withCourse, Integer semester) {
        Student student = new Student();
        student.setFirstName("Fee");
        student.setLastName("Tester");
        student.setEmail("fee." + System.nanoTime() + "@studenterp.local");
        student.setEnrollmentNumber("FEE" + System.nanoTime());
        student.setActive(true);
        student.setDepartment(department);
        student.setCourse(withCourse);
        student.setSemester(semester);
        return studentRepository.save(student);
    }

    // ------------------------------------------------------------ happy path

    @Test
    void assignsAStructureToAMatchingStudent() {
        var fee = structure(course, 3);
        var pupil = student(course, 3);

        var assigned = feeService.assignFee(pupil.getId(), fee.getId());

        assertThat(assigned.getTotalAmount()).isEqualByComparingTo("45000.00");
        assertThat(assigned.getDueAmount()).isEqualByComparingTo("45000.00");
        assertThat(assigned.getPaidAmount()).isEqualByComparingTo("0.00");
        assertThat(assigned.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(studentFeeRepository.findByStudentId(pupil.getId())).hasSize(1);
    }

    @Test
    void assigningTwiceIsANoOp() {
        var fee = structure(course, 4);
        var pupil = student(course, 4);

        feeService.assignFee(pupil.getId(), fee.getId());
        feeService.assignFee(pupil.getId(), fee.getId());

        assertThat(studentFeeRepository.findByStudentId(pupil.getId())).hasSize(1);
    }

    // --------------------------------------------------------- the reported bug

    @Test
    void studentWithoutACourseIsRejectedWithAReadableMessage() {
        var fee = structure(course, 5);
        var pupil = student(null, 5);

        assertThatThrownBy(() -> feeService.assignFee(pupil.getId(), fee.getId()))
                .hasMessageContaining("course");
    }

    @Test
    void studentWithoutASemesterIsRejectedWithAReadableMessage() {
        var fee = structure(course, 6);
        var pupil = student(course, null);

        assertThatThrownBy(() -> feeService.assignFee(pupil.getId(), fee.getId()))
                .hasMessageContaining("semester");
    }

    // ------------------------------------------------------------- mismatches

    @Test
    void refusesAStructureFromAnotherCourse() {
        var fee = structure(otherCourse, 7);
        var pupil = student(course, 7);

        assertThatThrownBy(() -> feeService.assignFee(pupil.getId(), fee.getId()))
                .hasMessageContaining("course");
    }

    // ------------------------------------------------------------ over HTTP

    /** The path the admin screen actually calls, query parameter and all. */
    @Test
    void assignsOverTheAdminEndpoint() throws Exception {
        var fee = structure(course, 1);
        var pupil = student(course, 1);

        HttpResponse<String> response = assignOverHttp(pupil.getId(), fee.getId());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body())
                .contains("\"studentId\":" + pupil.getId())
                .contains("\"status\":\"PENDING\"")
                .contains("45000");
        assertThat(studentFeeRepository.findByStudentId(pupil.getId())).hasSize(1);
    }

    /** The reported symptom: a 4xx whose message told the office nothing. */
    @Test
    void explainsItselfWhenTheStudentHasNoCourse() throws Exception {
        var fee = structure(course, 2);
        var pupil = student(null, 2);

        HttpResponse<String> response = assignOverHttp(pupil.getId(), fee.getId());

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.body()).contains("no course");
    }

    @Test
    void refusesAStructureForAnotherSemester() {
        var fee = structure(course, 8);
        var pupil = student(course, 2);

        assertThatThrownBy(() -> feeService.assignFee(pupil.getId(), fee.getId()))
                .hasMessageContaining("semester");
    }
}
