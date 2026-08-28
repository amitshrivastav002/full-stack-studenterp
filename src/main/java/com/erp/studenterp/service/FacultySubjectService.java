package com.erp.studenterp.service;

import com.erp.studenterp.dto.FacultySubjectRequest;
import com.erp.studenterp.dto.FacultySubjectResponse;

import com.erp.studenterp.entity.Faculty;
import com.erp.studenterp.entity.FacultySubject;
import com.erp.studenterp.entity.Subject;

import com.erp.studenterp.mapper.FacultySubjectMapper;

import com.erp.studenterp.repository.FacultyRepository;
import com.erp.studenterp.repository.FacultySubjectRepository;
import com.erp.studenterp.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacultySubjectService {

    private final FacultySubjectRepository facultySubjectRepository;

    private final FacultyRepository facultyRepository;

    private final SubjectRepository subjectRepository;


    // ==========================================
    // ASSIGN SUBJECT
    // ==========================================

    @Transactional
    public FacultySubjectResponse assignSubject(
            FacultySubjectRequest request) {

        Faculty faculty =
                facultyRepository
                        .findByIdAndActiveTrue(
                                request.getFacultyId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Faculty not found"
                                )
                        );

        Subject subject =
                subjectRepository
                        .findByIdAndActiveTrue(
                                request.getSubjectId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Subject not found"
                                )
                        );

        /*
         * Important validation:
         * faculty and subject should belong
         * to the same department.
         */
        if (!faculty.getDepartment()
                .getId()
                .equals(
                        subject.getDepartment().getId()
                )) {

            throw new RuntimeException(
                    "Faculty and subject belong to different departments"
            );
        }

        String academicYear =
                request.getAcademicYear().trim();

        String section =
                request.getSection()
                        .trim()
                        .toUpperCase();

        boolean alreadyAssigned =
                facultySubjectRepository
                        .existsByFacultyIdAndSubjectIdAndAcademicYearAndSectionAndActiveTrue(
                                faculty.getId(),
                                subject.getId(),
                                academicYear,
                                section
                        );

        if (alreadyAssigned) {

            throw new RuntimeException(
                    "Subject is already assigned to this faculty"
            );
        }

        FacultySubject assignment =
                new FacultySubject();

        assignment.setFaculty(faculty);

        assignment.setSubject(subject);

        assignment.setAcademicYear(
                academicYear
        );

        assignment.setSection(
                section
        );

        assignment.setActive(true);

        FacultySubject saved =
                facultySubjectRepository.save(
                        assignment
                );

        return FacultySubjectMapper
                .toResponse(saved);
    }


    // ==========================================
    // GET ASSIGNMENTS BY FACULTY ID
    // ADMIN USE
    // ==========================================

    @Transactional(readOnly = true)
    public List<FacultySubjectResponse>
    getFacultySubjects(Long facultyId) {

        facultyRepository
                .findByIdAndActiveTrue(facultyId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Faculty not found with ID: "
                                        + facultyId
                        )
                );

        return facultySubjectRepository
                .findByFacultyIdAndActiveTrue(
                        facultyId
                )
                .stream()
                .map(
                        FacultySubjectMapper::toResponse
                )
                .toList();
    }


    // ==========================================
    // GET EVERY ASSIGNMENT
    // ADMIN USE
    // ==========================================

    @Transactional(readOnly = true)
    public List<FacultySubjectResponse>
    getAllAssignments() {

        return facultySubjectRepository
                .findByActiveTrueOrderBySubjectSubjectCodeAsc()
                .stream()
                .map(
                        FacultySubjectMapper::toResponse
                )
                .toList();
    }


    // ==========================================
    // GET LOGGED-IN FACULTY SUBJECTS
    // ==========================================

    @Transactional(readOnly = true)
    public List<FacultySubjectResponse>
    getMySubjects(String email) {

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

        return facultySubjectRepository
                .findByFacultyIdAndActiveTrue(
                        faculty.getId()
                )
                .stream()
                .map(
                        FacultySubjectMapper::toResponse
                )
                .toList();
    }


    // ==========================================
    // REMOVE ASSIGNMENT
    // ==========================================

    @Transactional
    public void removeAssignment(Long assignmentId) {

        FacultySubject assignment =
                facultySubjectRepository
                        .findByIdAndActiveTrue(
                                assignmentId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Faculty subject assignment not found"
                                )
                        );

        assignment.setActive(false);

        facultySubjectRepository.save(
                assignment
        );
    }
}