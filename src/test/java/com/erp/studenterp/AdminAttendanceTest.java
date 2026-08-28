package com.erp.studenterp;

import com.erp.studenterp.dto.AttendanceItemRequest;
import com.erp.studenterp.dto.AttendanceRequest;
import com.erp.studenterp.dto.AttendanceResponse;
import com.erp.studenterp.entity.*;
import com.erp.studenterp.repository.*;
import com.erp.studenterp.service.AttendanceService;
import com.erp.studenterp.service.FacultySubjectService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The administration office marks attendance for classes it does not teach, so
 * the faculty ownership check is deliberately absent from that path.  These
 * cover what has to hold instead.
 */
@SpringBootTest
class AdminAttendanceTest {

    @Autowired AttendanceService attendanceService;
    @Autowired FacultySubjectService facultySubjectService;

    @Autowired DepartmentRepository departmentRepository;
    @Autowired CourseRepository courseRepository;
    @Autowired SubjectRepository subjectRepository;
    @Autowired FacultyRepository facultyRepository;
    @Autowired FacultySubjectRepository facultySubjectRepository;
    @Autowired StudentRepository studentRepository;

    private FacultySubject allocation;
    private Student first;
    private Student second;

    @BeforeEach
    void seedAClass() {
        if (allocation != null) return;

        Department department = departmentRepository
                .findByDepartmentName("Attendance Test Department")
                .orElseGet(() -> {
                    Department fresh = new Department();
                    fresh.setDepartmentName("Attendance Test Department");
                    fresh.setDepartmentCode("ATD");
                    return departmentRepository.save(fresh);
                });

        Course course = courseRepository
                .findByCourseName("Attendance Test Course")
                .orElseGet(() -> {
                    Course fresh = new Course();
                    fresh.setCourseName("Attendance Test Course");
                    fresh.setDuration(3);
                    fresh.setFees(1000.0);
                    return courseRepository.save(fresh);
                });

        Subject subject = new Subject();
        subject.setSubjectCode("ATT-" + System.nanoTime());
        subject.setSubjectName("Attendance Test Subject");
        subject.setSemester(2);
        subject.setCredits(4);
        subject.setActive(true);
        subject.setCourse(course);
        subject.setDepartment(department);
        subject = subjectRepository.save(subject);

        Faculty faculty = new Faculty();
        faculty.setEmployeeId("ATT-EMP-" + System.nanoTime());
        faculty.setFirstName("Test");
        faculty.setLastName("Lecturer");
        faculty.setEmail("attendance.lecturer." + System.nanoTime() + "@studenterp.local");
        faculty.setActive(true);
        faculty.setDepartment(department);
        faculty = facultyRepository.save(faculty);

        FacultySubject assignment = new FacultySubject();
        assignment.setFaculty(faculty);
        assignment.setSubject(subject);
        assignment.setSection("A");
        assignment.setAcademicYear("2025-2026");
        assignment.setActive(true);
        allocation = facultySubjectRepository.save(assignment);

        first = saveStudent(course, department, "Asha");
        second = saveStudent(course, department, "Bilal");
    }

    private Student saveStudent(Course course, Department department, String name) {
        Student student = new Student();
        student.setFirstName(name);
        student.setLastName("Tester");
        student.setEmail("attendance." + name.toLowerCase() + System.nanoTime() + "@studenterp.local");
        student.setEnrollmentNumber("ATT" + System.nanoTime());
        student.setSemester(2);
        student.setSection("A");
        student.setActive(true);
        student.setCourse(course);
        student.setDepartment(department);
        return studentRepository.save(student);
    }

    @Test
    void listsEveryAllocationForThePicker() {
        assertThat(facultySubjectService.getAllAssignments())
                .anySatisfy(row -> {
                    assertThat(row.getId()).isEqualTo(allocation.getId());
                    // The admin picker needs the course to tell two identically
                    // numbered semesters apart.
                    assertThat(row.getCourseName()).isEqualTo("Attendance Test Course");
                    assertThat(row.getFacultyName()).isEqualTo("Test Lecturer");
                });
    }

    @Test
    void rosterIsTheClassForThatCourseSemesterAndSection() {
        assertThat(attendanceService.getStudentsForAssignment(allocation.getId()))
                .extracting("studentId")
                .contains(first.getId(), second.getId());
    }

    @Test
    void marksAndThenCorrectsWithoutDuplicating() {
        LocalDate date = LocalDate.now().minusDays(1);

        List<AttendanceResponse> saved = attendanceService.markAttendanceForAssignment(
                request(date, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT));
        assertThat(saved).hasSize(2);

        assertThat(attendanceService.getAttendanceForAssignment(allocation.getId(), date))
                .hasSize(2)
                .anySatisfy(row -> {
                    assertThat(row.getStudentId()).isEqualTo(second.getId());
                    assertThat(row.getStatus()).isEqualTo(AttendanceStatus.ABSENT);
                });

        // Correcting the register must overwrite the row, not add a second one
        // for the same student on the same day.
        attendanceService.markAttendanceForAssignment(
                request(date, AttendanceStatus.PRESENT, AttendanceStatus.LATE));

        assertThat(attendanceService.getAttendanceForAssignment(allocation.getId(), date))
                .hasSize(2)
                .anySatisfy(row -> {
                    assertThat(row.getStudentId()).isEqualTo(second.getId());
                    assertThat(row.getStatus()).isEqualTo(AttendanceStatus.LATE);
                });
    }

    @Test
    void refusesAFutureDate() {
        assertThatThrownBy(() -> attendanceService.markAttendanceForAssignment(
                request(LocalDate.now().plusDays(1),
                        AttendanceStatus.PRESENT, AttendanceStatus.PRESENT)))
                .hasMessageContaining("future");
    }

    @Test
    void refusesAnUnknownAllocation() {
        assertThatThrownBy(() ->
                attendanceService.getStudentsForAssignment(999_999L))
                .hasMessageContaining("not found");
    }

    private AttendanceRequest request(
            LocalDate date, AttendanceStatus forFirst, AttendanceStatus forSecond) {

        AttendanceItemRequest one = new AttendanceItemRequest();
        one.setStudentId(first.getId());
        one.setStatus(forFirst);

        AttendanceItemRequest two = new AttendanceItemRequest();
        two.setStudentId(second.getId());
        two.setStatus(forSecond);

        AttendanceRequest request = new AttendanceRequest();
        request.setFacultySubjectId(allocation.getId());
        request.setAttendanceDate(date);
        request.setStudents(List.of(one, two));
        return request;
    }
}
