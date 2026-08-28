package com.erp.studenterp.repository;

import com.erp.studenterp.entity.Attendance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    Optional<Attendance>
    findByStudentIdAndFacultySubjectIdAndAttendanceDate(
            Long studentId,
            Long facultySubjectId,
            LocalDate attendanceDate
    );

    List<Attendance>
    findByFacultySubjectIdAndAttendanceDate(
            Long facultySubjectId,
            LocalDate attendanceDate
    );

    List<Attendance>
    findByStudentIdAndFacultySubjectSubjectId(
            Long studentId,
            Long subjectId
    );
    List<Attendance> findByStudentId(Long studentId);

    long countByAttendanceDate(LocalDate attendanceDate);

    long countByAttendanceDateAndStatus(
            LocalDate attendanceDate,
            com.erp.studenterp.entity.AttendanceStatus status);

    long countByStudentId(Long studentId);

    long countByStudentIdAndStatus(
            Long studentId,
            com.erp.studenterp.entity.AttendanceStatus status);
}
