package com.erp.studenterp.service;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.*;

import com.erp.studenterp.repository.AttendanceRepository;
import com.erp.studenterp.repository.FacultyRepository;
import com.erp.studenterp.repository.FacultySubjectRepository;
import com.erp.studenterp.repository.StudentRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;

    private final FacultyRepository facultyRepository;

    private final FacultySubjectRepository
            facultySubjectRepository;

    private final StudentRepository studentRepository;


    // ==========================================
    // GET STUDENTS FOR ASSIGNED SUBJECT
    // ==========================================

    @Transactional(readOnly = true)
    public List<AttendanceStudentResponse>
    getStudentsForAttendance(
            String facultyEmail,
            Long facultySubjectId) {

        Faculty faculty =
                getFaculty(facultyEmail);

        FacultySubject assignment =
                getAssignment(facultySubjectId);

        verifyFacultyAssignment(
                faculty,
                assignment
        );

        return rosterFor(assignment);
    }


    // ==========================================
    // GET STUDENTS FOR ANY ALLOCATION
    // ADMIN USE
    // ==========================================

    /**
     * The administration office marks for any class, so there is no faculty to
     * own the allocation here.  Every other rule still applies.
     */
    @Transactional(readOnly = true)
    public List<AttendanceStudentResponse>
    getStudentsForAssignment(
            Long facultySubjectId) {

        return rosterFor(
                getAssignment(facultySubjectId)
        );
    }


    // ==========================================
    // ROSTER FOR AN ALLOCATION
    // ==========================================

    private List<AttendanceStudentResponse>
    rosterFor(FacultySubject assignment) {

        Subject subject =
                assignment.getSubject();

        Long courseId =
                subject.getCourse().getId();

        Integer semester =
                subject.getSemester();

        String section =
                assignment.getSection();

        List<Student> students =
                studentRepository
                        .findByCourseIdAndSemesterAndSectionIgnoreCaseAndActiveTrue(
                                courseId,
                                semester,
                                section
                        );

        return students
                .stream()
                .map(this::toStudentResponse)
                .toList();
    }


    // ==========================================
    // MARK ATTENDANCE
    // ==========================================

    @Transactional
    public List<AttendanceResponse>
    markAttendance(
            String facultyEmail,
            AttendanceRequest request) {

        Faculty faculty =
                getFaculty(facultyEmail);

        FacultySubject assignment =
                getAssignment(
                        request.getFacultySubjectId()
                );

        verifyFacultyAssignment(
                faculty,
                assignment
        );

        return recordAll(assignment, request);
    }


    // ==========================================
    // MARK ATTENDANCE FOR ANY ALLOCATION
    // ADMIN USE
    // ==========================================

    @Transactional
    public List<AttendanceResponse>
    markAttendanceForAssignment(
            AttendanceRequest request) {

        return recordAll(
                getAssignment(
                        request.getFacultySubjectId()
                ),
                request
        );
    }


    // ==========================================
    // RECORD EVERY ROW OF ONE REQUEST
    // ==========================================

    private List<AttendanceResponse> recordAll(
            FacultySubject assignment,
            AttendanceRequest request) {

        if (request.getAttendanceDate()
                .isAfter(LocalDate.now())) {

            throw new RuntimeException(
                    "Attendance date cannot be in the future"
            );
        }

        return request
                .getStudents()
                .stream()
                .map(item ->
                        saveAttendance(
                                assignment,
                                request.getAttendanceDate(),
                                item
                        )
                )
                .toList();
    }


    // ==========================================
    // SAVE / UPDATE ATTENDANCE
    // ==========================================

    private AttendanceResponse saveAttendance(
            FacultySubject assignment,
            LocalDate date,
            AttendanceItemRequest item) {

        Student student =
                studentRepository
                        .findByIdAndActiveTrue(
                                item.getStudentId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Student not found: "
                                                + item.getStudentId()
                                )
                        );

        verifyStudent(
                student,
                assignment
        );

        Attendance attendance =
                attendanceRepository
                        .findByStudentIdAndFacultySubjectIdAndAttendanceDate(
                                student.getId(),
                                assignment.getId(),
                                date
                        )
                        .orElseGet(
                                Attendance::new
                        );

        attendance.setStudent(student);

        attendance.setFacultySubject(
                assignment
        );

        attendance.setAttendanceDate(date);

        attendance.setStatus(
                item.getStatus()
        );

        attendance.setRemarks(
                item.getRemarks()
        );

        Attendance saved =
                attendanceRepository.save(
                        attendance
                );

        return toResponse(saved);
    }


    // ==========================================
    // GET ATTENDANCE FOR A DATE
    // ==========================================

    @Transactional(readOnly = true)
    public List<AttendanceResponse>
    getAttendance(
            String facultyEmail,
            Long facultySubjectId,
            LocalDate date) {

        Faculty faculty =
                getFaculty(facultyEmail);

        FacultySubject assignment =
                getAssignment(facultySubjectId);

        verifyFacultyAssignment(
                faculty,
                assignment
        );

        return attendanceFor(facultySubjectId, date);
    }


    // ==========================================
    // GET ATTENDANCE FOR ANY ALLOCATION
    // ADMIN USE
    // ==========================================

    @Transactional(readOnly = true)
    public List<AttendanceResponse>
    getAttendanceForAssignment(
            Long facultySubjectId,
            LocalDate date) {

        // Resolved first so an unknown allocation reads the same for an admin
        // as it does for a faculty member.
        getAssignment(facultySubjectId);

        return attendanceFor(facultySubjectId, date);
    }


    // ==========================================
    // ATTENDANCE ON ONE DATE
    // ==========================================

    private List<AttendanceResponse> attendanceFor(
            Long facultySubjectId,
            LocalDate date) {

        return attendanceRepository
                .findByFacultySubjectIdAndAttendanceDate(
                        facultySubjectId,
                        date
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // ==========================================
    // GET FACULTY
    // ==========================================

    private Faculty getFaculty(
            String email) {

        Faculty faculty =
                facultyRepository
                        .findByUserEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Faculty profile not found"
                                )
                        );

        if (!faculty.isActive()) {

            throw new RuntimeException(
                    "Faculty account is inactive"
            );
        }

        return faculty;
    }


    // ==========================================
    // GET ASSIGNMENT
    // ==========================================

    private FacultySubject getAssignment(
            Long id) {

        return facultySubjectRepository
                .findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Faculty subject assignment not found"
                        )
                );
    }


    // ==========================================
    // VERIFY FACULTY
    // ==========================================

    private void verifyFacultyAssignment(
            Faculty faculty,
            FacultySubject assignment) {

        if (!assignment
                .getFaculty()
                .getId()
                .equals(faculty.getId())) {

            throw new RuntimeException(
                    "You are not assigned to this subject"
            );
        }
    }


    // ==========================================
    // VERIFY STUDENT
    // ==========================================

    private void verifyStudent(
            Student student,
            FacultySubject assignment) {

        Subject subject =
                assignment.getSubject();

        if (student.getCourse() == null ||
                !student.getCourse()
                        .getId()
                        .equals(
                                subject.getCourse().getId()
                        )) {

            throw new RuntimeException(
                    "Student does not belong to this course"
            );
        }

        if (student.getSemester() == null ||
                !student.getSemester()
                        .equals(
                                subject.getSemester()
                        )) {

            throw new RuntimeException(
                    "Student does not belong to this semester"
            );
        }

        if (student.getSection() == null ||
                !student.getSection()
                        .equalsIgnoreCase(
                                assignment.getSection()
                        )) {

            throw new RuntimeException(
                    "Student does not belong to this section"
            );
        }
    }


    // ==========================================
    // STUDENT RESPONSE
    // ==========================================

    private AttendanceStudentResponse
    toStudentResponse(
            Student student) {

        String name =
                student.getFirstName();

        if (student.getLastName() != null &&
                !student.getLastName().isBlank()) {

            name +=
                    " " + student.getLastName();
        }

        return AttendanceStudentResponse
                .builder()

                .studentId(
                        student.getId()
                )

                .enrollmentNumber(
                        student.getEnrollmentNumber()
                )

                .studentName(name)

                .semester(
                        student.getSemester()
                )

                .section(
                        student.getSection()
                )

                .build();
    }


    // ==========================================
    // ATTENDANCE RESPONSE
    // ==========================================

    private AttendanceResponse
    toResponse(
            Attendance attendance) {

        Student student =
                attendance.getStudent();

        Subject subject =
                attendance
                        .getFacultySubject()
                        .getSubject();

        String studentName =
                student.getFirstName();

        if (student.getLastName() != null &&
                !student.getLastName().isBlank()) {

            studentName +=
                    " " + student.getLastName();
        }

        return AttendanceResponse
                .builder()

                .id(
                        attendance.getId()
                )

                .studentId(
                        student.getId()
                )

                .enrollmentNumber(
                        student.getEnrollmentNumber()
                )

                .studentName(
                        studentName
                )

                .facultySubjectId(
                        attendance
                                .getFacultySubject()
                                .getId()
                )

                .subjectId(
                        subject.getId()
                )

                .subjectCode(
                        subject.getSubjectCode()
                )

                .subjectName(
                        subject.getSubjectName()
                )

                .attendanceDate(
                        attendance.getAttendanceDate()
                )

                .status(
                        attendance.getStatus()
                )

                .remarks(
                        attendance.getRemarks()
                )

                .build();
    }
    @Transactional(readOnly = true)
public List<StudentAttendanceSummary>
getStudentAttendanceSummary(Long studentId) {

    studentRepository
            .findByIdAndActiveTrue(studentId)
            .orElseThrow(() ->
                    new RuntimeException(
                            "Student not found with ID: "
                                    + studentId
                    )
            );

    List<Attendance> records =
            attendanceRepository
                    .findByStudentId(studentId);

    return records
            .stream()
            .collect(
                    java.util.stream.Collectors.groupingBy(
                            attendance ->
                                    attendance
                                            .getFacultySubject()
                                            .getSubject()
                                            .getId()
                    )
            )
            .values()
            .stream()
            .map(this::buildSummary)
            .toList();
}
private StudentAttendanceSummary buildSummary(
        List<Attendance> records) {

    if (records.isEmpty()) {
        throw new RuntimeException(
                "Attendance records not found"
        );
    }

    Attendance first = records.get(0);

    Subject subject =
            first.getFacultySubject()
                    .getSubject();

    long total = records.size();

    long present =
            records.stream()
                    .filter(a ->
                            a.getStatus()
                                    == AttendanceStatus.PRESENT
                    )
                    .count();

    long absent =
            records.stream()
                    .filter(a ->
                            a.getStatus()
                                    == AttendanceStatus.ABSENT
                    )
                    .count();

    long late =
            records.stream()
                    .filter(a ->
                            a.getStatus()
                                    == AttendanceStatus.LATE
                    )
                    .count();

    long excused =
            records.stream()
                    .filter(a ->
                            a.getStatus()
                                    == AttendanceStatus.EXCUSED
                    )
                    .count();

    /*
     * PRESENT + LATE are treated as attended.
     */
    long attended = present + late;

    double percentage =
            total == 0
                    ? 0.0
                    : (attended * 100.0) / total;

    return StudentAttendanceSummary
            .builder()

            .subjectId(
                    subject.getId()
            )

            .subjectCode(
                    subject.getSubjectCode()
            )

            .subjectName(
                    subject.getSubjectName()
            )

            .totalClasses(total)

            .presentClasses(present)

            .absentClasses(absent)

            .lateClasses(late)

            .excusedClasses(excused)

            .attendancePercentage(
                    Math.round(
                            percentage * 100.0
                    ) / 100.0
            )

            .lowAttendance(
                    percentage < 75.0
            )

            .build();
}
}
