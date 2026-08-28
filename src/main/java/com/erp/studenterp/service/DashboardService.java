package com.erp.studenterp.service;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.*;
import com.erp.studenterp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.function.Supplier;

/**
 * Read-only roll-ups for the three portal home pages. Everything here is derived
 * from the operational tables, so the numbers always match the detail screens.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final StudentLeaveRepository leaveRepository;
    private final StudentFeeRepository studentFeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final BookIssueRepository bookIssueRepository;
    private final HostelAllocationRepository hostelAllocationRepository;
    private final TransportAssignmentRepository transportAssignmentRepository;
    private final FacultySubjectRepository facultySubjectRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final NoticeService noticeService;
    private final ProfileService profileService;
    private final TimetableService timetableService;

    private static final int RECENT_NOTICES = 5;

    // ------------------------------------------------------------------ admin

    @Transactional(readOnly = true)
    public AdminDashboardResponse admin() {

        LocalDate today = LocalDate.now();
        long markedToday = attendanceRepository.countByAttendanceDate(today);
        long presentToday = attendanceRepository.countByAttendanceDateAndStatus(
                today, AttendanceStatus.PRESENT);

        return AdminDashboardResponse.builder()
                .totalStudents(studentRepository.countByActiveTrue())
                .totalFaculty(facultyRepository.countByActiveTrue())
                .totalCourses(courseRepository.count())
                .totalDepartments(departmentRepository.count())
                .totalSubjects(subjectRepository.countByActiveTrue())
                .pendingLeaves(leaveRepository.countByStatus(LeaveStatus.PENDING))
                .feesBilled(studentFeeRepository.sumBilled())
                .feesCollected(studentFeeRepository.sumCollected())
                .feesOutstanding(studentFeeRepository.sumOutstanding())
                .attendanceTodayPercent(percentage(presentToday, markedToday))
                .attendanceMarkedToday(markedToday)
                .booksOnLoan(bookIssueRepository.countByStatus(BookIssueStatus.ISSUED))
                .hostelResidents(hostelAllocationRepository.countByActiveTrue())
                .transportRiders(transportAssignmentRepository.countByActiveTrue())
                .latestNotices(recent(noticeService.findForRole(Role.ADMIN)))
                .build();
    }

    // ---------------------------------------------------------------- faculty

    @Transactional(readOnly = true)
    public FacultyDashboardResponse faculty(String email, String academicYear) {

        Faculty faculty = profileService.requireFaculty(email);

        List<Assignment> assignments = assignmentRepository.findByFaculty(faculty.getId());

        long awaitingGrading = assignments.stream()
                .mapToLong(assignment ->
                        submissionRepository.countByAssignmentId(assignment.getId())
                                - submissionRepository.countByAssignmentIdAndStatus(
                                        assignment.getId(), SubmissionStatus.GRADED))
                .sum();

        return FacultyDashboardResponse.builder()
                .facultyName(fullName(faculty.getFirstName(), faculty.getLastName()))
                .employeeId(faculty.getEmployeeId())
                .departmentName(faculty.getDepartment() == null
                        ? null : faculty.getDepartment().getDepartmentName())
                .allocatedSubjects(
                        facultySubjectRepository.findByFacultyIdAndActiveTrue(faculty.getId()).size())
                .assignmentsSet(assignments.size())
                .submissionsAwaitingGrading(awaitingGrading)
                .pendingLeaveRequests(
                        leaveRepository.countByStatus(LeaveStatus.PENDING))
                .classesToday(classesToday(academicYear,
                        () -> timetableService.getFacultyTimetable(email, academicYear)))
                .latestNotices(recent(noticeService.findForRole(Role.FACULTY)))
                .build();
    }

    // ---------------------------------------------------------------- student

    @Transactional(readOnly = true)
    public StudentDashboardResponse student(String email, String academicYear) {

        Student student = profileService.requireStudent(email);
        Long studentId = student.getId();

        long held = attendanceRepository.countByStudentId(studentId);
        long attended = attendanceRepository.countByStudentIdAndStatus(
                studentId, AttendanceStatus.PRESENT);

        long assignmentsDue = student.getCourse() == null
                || student.getSemester() == null
                || student.getSection() == null
                ? 0
                : assignmentRepository.findForClass(
                                student.getCourse().getId(),
                                student.getSemester(),
                                student.getSection())
                        .stream()
                        .filter(assignment -> submissionRepository
                                .findByAssignmentIdAndStudentId(assignment.getId(), studentId)
                                .isEmpty())
                        .filter(assignment -> !assignment.getDueDate().isBefore(LocalDate.now()))
                        .count();

        String hostelRoom = hostelAllocationRepository.findByStudentIdAndActiveTrue(studentId)
                .map(allocation -> allocation.getRoom().getBlockName()
                        + " - " + allocation.getRoom().getRoomNumber())
                .orElse(null);

        String transportRoute = transportAssignmentRepository.findByStudentIdAndActiveTrue(studentId)
                .map(assignment -> assignment.getRoute().getRouteCode()
                        + " - " + assignment.getRoute().getRouteName())
                .orElse(null);

        return StudentDashboardResponse.builder()
                .studentName(fullName(student.getFirstName(), student.getLastName()))
                .enrollmentNumber(student.getEnrollmentNumber())
                .courseName(student.getCourse() == null
                        ? null : student.getCourse().getCourseName())
                .semester(student.getSemester())
                .section(student.getSection())
                .attendancePercent(percentage(attended, held))
                .periodsAttended(attended)
                .periodsHeld(held)
                .feesOutstanding(studentFeeRepository.sumDueForStudent(studentId))
                .assignmentsDue(assignmentsDue)
                .booksHeld(bookIssueRepository.countByStudentIdAndStatus(
                        studentId, BookIssueStatus.ISSUED))
                .hostelRoom(hostelRoom)
                .transportRoute(transportRoute)
                .pendingLeaves(leaveRepository.countByStudentIdAndStatus(
                        studentId, LeaveStatus.PENDING))
                .classesToday(classesToday(academicYear,
                        () -> timetableService.getStudentTimetable(email, academicYear)))
                .latestNotices(recent(noticeService.findForRole(Role.STUDENT)))
                .build();
    }

    // ---------------------------------------------------------------- helpers

    /**
     * The timetable is a weekly grid, so today's row is filtered out of it here.
     * The lookup is deferred because it needs an academic year to run at all.
     */
    private List<TimetableResponse> classesToday(
            String academicYear, Supplier<List<TimetableResponse>> weeklyTimetable) {

        if (academicYear == null || academicYear.isBlank()) {
            return List.of();
        }

        return weeklyTimetable.get().stream()
                .filter(entry -> entry.getDay() == LocalDate.now().getDayOfWeek())
                .sorted((a, b) -> a.getStartTime().compareTo(b.getStartTime()))
                .toList();
    }

    private List<NoticeResponse> recent(List<NoticeResponse> notices) {
        return notices.stream().limit(RECENT_NOTICES).toList();
    }

    private BigDecimal percentage(long part, long whole) {
        if (whole <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(part)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(whole), 2, RoundingMode.HALF_UP);
    }

    private String fullName(String first, String last) {
        return last == null || last.isBlank() ? first : first + " " + last;
    }
}
