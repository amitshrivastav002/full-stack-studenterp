package com.erp.studenterp;

import com.erp.studenterp.entity.*;
import com.erp.studenterp.repository.*;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

/**
 * /api/student/attendance/{studentId} takes the id straight from the URL while
 * every other student endpoint resolves the caller from their token.  This pins
 * down whether one student can read another's record.
 */
@SpringBootTest(webEnvironment = RANDOM_PORT)
class StudentAttendanceAccessTest {

    @LocalServerPort int port;

    @Autowired UserRepository userRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired DepartmentRepository departmentRepository;
    @Autowired CourseRepository courseRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String PASSWORD = "IdorProbe123";

    private Student mine;
    private Student theirs;

    private final HttpClient http = HttpClient.newHttpClient();

    @BeforeEach
    void seedTwoStudents() {
        if (mine != null) return;

        Department department = departmentRepository.findByDepartmentName("IDOR Department")
                .orElseGet(() -> {
                    Department fresh = new Department();
                    fresh.setDepartmentName("IDOR Department");
                    fresh.setDepartmentCode("IDOR");
                    return departmentRepository.save(fresh);
                });

        Course course = courseRepository.findByCourseName("IDOR Course")
                .orElseGet(() -> {
                    Course fresh = new Course();
                    fresh.setCourseName("IDOR Course");
                    fresh.setDuration(3);
                    return courseRepository.save(fresh);
                });

        mine = createStudent("idor.mine@studenterp.local", "Mine", department, course);
        theirs = createStudent("idor.theirs@studenterp.local", "Theirs", department, course);
    }

    private Student createStudent(String email, String name, Department d, Course c) {
        if (!userRepository.existsByEmail(email)) {
            User user = new User();
            user.setFullName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(PASSWORD));
            user.setRole(Role.STUDENT);
            userRepository.save(user);
        }

        return studentRepository.findByEmailAndActiveTrue(email).orElseGet(() -> {
            Student student = new Student();
            student.setFirstName(name);
            student.setLastName("Student");
            student.setEmail(email);
            student.setEnrollmentNumber("IDOR" + System.nanoTime());
            student.setActive(true);
            student.setSemester(1);
            student.setSection("A");
            student.setDepartment(d);
            student.setCourse(c);
            return studentRepository.save(student);
        });
    }

    private String tokenFor(String email) throws Exception {
        HttpResponse<String> response = http.send(
                HttpRequest.newBuilder(URI.create(
                                "http://localhost:" + port + "/api/auth/login"))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(
                                "{\"email\":\"" + email + "\",\"password\":\""
                                        + PASSWORD + "\"}"))
                        .build(),
                HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        return response.body().replaceAll(".*\"token\"\\s*:\\s*\"([^\"]+)\".*", "$1");
    }

    private HttpResponse<String> attendanceOf(Long studentId, String token)
            throws Exception {

        return http.send(
                HttpRequest.newBuilder(URI.create("http://localhost:" + port
                                + "/api/student/attendance/" + studentId))
                        .header("Authorization", "Bearer " + token)
                        .GET().build(),
                HttpResponse.BodyHandlers.ofString());
    }

    @Test
    void aStudentCanReadTheirOwnAttendance() throws Exception {
        HttpResponse<String> response = attendanceOf(mine.getId(), tokenFor(mine.getEmail()));

        assertThat(response.statusCode()).isEqualTo(200);
    }

    @Test
    void aStudentCannotReadAnotherStudentsAttendance() throws Exception {
        HttpResponse<String> response =
                attendanceOf(theirs.getId(), tokenFor(mine.getEmail()));

        assertThat(response.statusCode())
                .describedAs("reading another student's attendance must be refused")
                .isIn(403, 404);
    }
}
