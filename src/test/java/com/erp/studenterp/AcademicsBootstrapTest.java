package com.erp.studenterp;

import com.erp.studenterp.config.AcademicsBootstrap;
import com.erp.studenterp.repository.CourseRepository;
import com.erp.studenterp.repository.DepartmentRepository;
import com.erp.studenterp.repository.SubjectRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards the seeded academic catalogue.  Deliberately asserts no row totals, so
 * adding courses or subjects to the seed does not break the test; what it does
 * check is that every seeded row is usable and that a restart never duplicates
 * one.
 */
@SpringBootTest
class AcademicsBootstrapTest {

    @Autowired DepartmentRepository departments;
    @Autowired CourseRepository courses;
    @Autowired SubjectRepository subjects;
    @Autowired AcademicsBootstrap bootstrap;

    @Test
    void everySeededSubjectIsUsable() {
        assertThat(departments.count()).isPositive();
        assertThat(courses.count()).isPositive();
        assertThat(subjects.count()).isPositive();

        // course and department are NOT NULL in the schema, and a subject with no
        // credits or a nonsense semester would never show up in the portal.
        assertThat(subjects.findAll()).allSatisfy(subject -> {
            assertThat(subject.getCourse()).isNotNull();
            assertThat(subject.getDepartment()).isNotNull();
            assertThat(subject.getCredits()).isPositive();
            assertThat(subject.getSemester()).isBetween(1, 8);
            assertThat(subject.isActive()).isTrue();
        });
    }

    @Test
    void semesterLookupFindsTheSeededSubjects() {
        var cse = courses.findByCourseName("B.Tech Computer Science & Engineering")
                .orElseThrow();

        assertThat(subjects.findByCourseIdAndSemesterAndActiveTrue(cse.getId(), 5))
                .isNotEmpty()
                .allSatisfy(subject -> assertThat(subject.getSemester()).isEqualTo(5));
    }

    /** A restart must top the catalogue up, never duplicate it. */
    @Test
    void isIdempotentOnASecondRun() {
        long seededDepartments = departments.count();
        long seededCourses = courses.count();
        long seededSubjects = subjects.count();

        bootstrap.run();
        bootstrap.run();

        assertThat(departments.count()).isEqualTo(seededDepartments);
        assertThat(courses.count()).isEqualTo(seededCourses);
        assertThat(subjects.count()).isEqualTo(seededSubjects);
    }
}
