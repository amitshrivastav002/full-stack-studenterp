package com.erp.studenterp;

import com.erp.studenterp.entity.Student;
import com.erp.studenterp.exception.BadRequestException;
import com.erp.studenterp.repository.StudentRepository;
import com.erp.studenterp.service.FeeService;
import com.erp.studenterp.service.StudentService;
import com.erp.studenterp.service.TimetableService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Student.course, .department, .semester and .section are all optional on the
 * entity, so a record can exist without them.  Reading such a student must not
 * take a screen down with it, and an operation that genuinely needs a class
 * must say so rather than throw a NullPointerException.
 */
@SpringBootTest
class StudentWithoutClassTest {

    @Autowired StudentService studentService;
    @Autowired TimetableService timetableService;
    @Autowired FeeService feeService;
    @Autowired StudentRepository studentRepository;

    private static final String EMAIL = "no.class@studenterp.local";

    private Student orphan;

    @BeforeEach
    void seedAStudentWithNoClass() {
        orphan = studentRepository.findByEmailAndActiveTrue(EMAIL).orElseGet(() -> {
            Student student = new Student();
            student.setFirstName("Unplaced");
            student.setLastName("Student");
            student.setEmail(EMAIL);
            student.setEnrollmentNumber("NOCLASS" + System.nanoTime());
            student.setActive(true);
            // course, department, semester and section all deliberately unset
            return studentRepository.save(student);
        });
    }

    @Test
    void readingOneDoesNotBreakTheListing() {
        var response = studentService.getStudentById(orphan.getId());

        assertThat(response.getCourseId()).isNull();
        assertThat(response.getCourseName()).isNull();
        assertThat(response.getDepartmentId()).isNull();
        assertThat(response.getFirstName()).isEqualTo("Unplaced");
    }

    @Test
    void theWholeStudentPageStillLoads() {
        assertThatCode(() -> studentService.getAllStudents(0, 50, "id", "asc"))
                .doesNotThrowAnyException();
    }

    @Test
    void theTimetableExplainsWhatIsMissing() {
        assertThatThrownBy(() -> timetableService.getStudentTimetable(EMAIL, "2025-2026"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("course, semester and section");
    }

    @Test
    void autoAssigningFeesIsSimplyANoOp() {
        assertThatCode(() -> feeService.assignActiveFeesToStudent(orphan.getId()))
                .doesNotThrowAnyException();
    }
}
