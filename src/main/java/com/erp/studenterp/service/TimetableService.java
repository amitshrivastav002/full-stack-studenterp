package com.erp.studenterp.service;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.*;
import com.erp.studenterp.exception.BadRequestException;
import com.erp.studenterp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TimetableService {
    private final TimetableRepository timetableRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final FacultyRepository facultyRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public TimetableResponse create(TimetableRequest request) { return save(null, request); }
    @Transactional
    public TimetableResponse update(Long id, TimetableRequest request) {
        return save(timetableRepository.findById(id).orElseThrow(() -> new RuntimeException("Timetable entry not found")), request);
    }
    @Transactional
    public void delete(Long id) { TimetableEntry entry = timetableRepository.findById(id).orElseThrow(() -> new RuntimeException("Timetable entry not found")); entry.setActive(false); timetableRepository.save(entry); }

    @Transactional(readOnly = true)
    public List<TimetableResponse> getClassTimetable(Long courseId, Integer semester, String section, String academicYear) {
        return timetableRepository.findByCourseIdAndSemesterAndSectionIgnoreCaseAndAcademicYearAndActiveTrueOrderByDayAscStartTimeAsc(courseId, semester, section, academicYear).stream().map(this::toResponse).toList();
    }
    @Transactional(readOnly = true)
    public List<TimetableResponse> getFacultyTimetable(Long facultyId, String academicYear) {
        return timetableRepository.findByFacultyIdAndAcademicYearAndActiveTrueOrderByDayAscStartTimeAsc(facultyId, academicYear).stream().map(this::toResponse).toList();
    }
    @Transactional(readOnly = true)
    public List<TimetableResponse> getStudentTimetable(String email, String academicYear) {
        Student student = studentRepository.findByEmailAndActiveTrue(email).orElseThrow(() -> new RuntimeException("Student profile not found"));
        // A timetable is a property of a class, so there is nothing to look up
        // until the student has been placed on one.
        if (student.getCourse() == null || student.getSemester() == null
                || student.getSection() == null || student.getSection().isBlank()) {
            throw new BadRequestException(
                    "Your course, semester and section must be set before a timetable can be shown");
        }
        return getClassTimetable(student.getCourse().getId(), student.getSemester(), student.getSection(), academicYear);
    }
    @Transactional(readOnly = true)
    public List<TimetableResponse> getFacultyTimetable(String email, String academicYear) {
        Faculty faculty = facultyRepository.findByUserEmail(email).orElseThrow(() -> new RuntimeException("Faculty profile not found"));
        return getFacultyTimetable(faculty.getId(), academicYear);
    }

    private TimetableResponse save(TimetableEntry entry, TimetableRequest request) {
        if (!request.getEndTime().isAfter(request.getStartTime())) throw new RuntimeException("End time must be after start time");
        Course course = courseRepository.findById(request.getCourseId()).orElseThrow(() -> new RuntimeException("Course not found"));
        Subject subject = subjectRepository.findByIdAndActiveTrue(request.getSubjectId()).orElseThrow(() -> new RuntimeException("Subject not found"));
        Faculty faculty = facultyRepository.findByIdAndActiveTrue(request.getFacultyId()).orElseThrow(() -> new RuntimeException("Faculty not found"));
        if (!subject.getCourse().getId().equals(course.getId()) || !subject.getSemester().equals(request.getSemester())) throw new RuntimeException("Subject does not belong to the selected course and semester");
        validateConflicts(entry == null ? null : entry.getId(), request);
        TimetableEntry target = entry == null ? new TimetableEntry() : entry;
        target.setCourse(course); target.setSemester(request.getSemester()); target.setSection(request.getSection().trim()); target.setDay(request.getDay()); target.setStartTime(request.getStartTime()); target.setEndTime(request.getEndTime()); target.setSubject(subject); target.setFaculty(faculty); target.setRoom(request.getRoom().trim()); target.setAcademicYear(request.getAcademicYear().trim()); target.setActive(true);
        return toResponse(timetableRepository.save(target));
    }

    private void validateConflicts(Long ignoredId, TimetableRequest request) {
        for (TimetableEntry existing : timetableRepository.findByAcademicYearAndDayAndActiveTrue(request.getAcademicYear().trim(), request.getDay())) {
            if (existing.getId().equals(ignoredId) || !overlaps(existing.getStartTime(), existing.getEndTime(), request.getStartTime(), request.getEndTime())) continue;
            boolean sameClass = existing.getCourse().getId().equals(request.getCourseId()) && existing.getSemester().equals(request.getSemester()) && existing.getSection().equalsIgnoreCase(request.getSection().trim());
            if (sameClass) throw new RuntimeException("Class section already has a timetable entry in this time slot");
            if (existing.getFaculty().getId().equals(request.getFacultyId())) throw new RuntimeException("Faculty is already assigned in this time slot");
            if (existing.getRoom().equalsIgnoreCase(request.getRoom().trim())) throw new RuntimeException("Room is already occupied in this time slot");
        }
    }
    private boolean overlaps(LocalTime aStart, LocalTime aEnd, LocalTime bStart, LocalTime bEnd) { return aStart.isBefore(bEnd) && bStart.isBefore(aEnd); }
    private TimetableResponse toResponse(TimetableEntry e) { return TimetableResponse.builder().id(e.getId()).courseId(e.getCourse().getId()).courseName(e.getCourse().getCourseName()).semester(e.getSemester()).section(e.getSection()).day(e.getDay()).startTime(e.getStartTime()).endTime(e.getEndTime()).subjectId(e.getSubject().getId()).subjectCode(e.getSubject().getSubjectCode()).subjectName(e.getSubject().getSubjectName()).facultyId(e.getFaculty().getId()).facultyName(e.getFaculty().getFirstName() + (e.getFaculty().getLastName() == null ? "" : " " + e.getFaculty().getLastName())).room(e.getRoom()).academicYear(e.getAcademicYear()).build(); }
}
