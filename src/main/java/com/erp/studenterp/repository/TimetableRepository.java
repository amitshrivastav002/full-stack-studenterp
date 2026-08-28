package com.erp.studenterp.repository;

import com.erp.studenterp.entity.TimetableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface TimetableRepository extends JpaRepository<TimetableEntry, Long> {
    List<TimetableEntry> findByCourseIdAndSemesterAndSectionIgnoreCaseAndAcademicYearAndActiveTrueOrderByDayAscStartTimeAsc(Long courseId, Integer semester, String section, String academicYear);
    List<TimetableEntry> findByFacultyIdAndAcademicYearAndActiveTrueOrderByDayAscStartTimeAsc(Long facultyId, String academicYear);
    List<TimetableEntry> findByAcademicYearAndDayAndActiveTrue(String academicYear, java.time.DayOfWeek day);
}
