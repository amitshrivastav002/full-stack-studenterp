package com.erp.studenterp.service;

import com.erp.studenterp.dto.SubjectRequest;
import com.erp.studenterp.dto.SubjectResponse;

import com.erp.studenterp.entity.Course;
import com.erp.studenterp.entity.Department;
import com.erp.studenterp.entity.Subject;

import com.erp.studenterp.mapper.SubjectMapper;

import com.erp.studenterp.repository.CourseRepository;
import com.erp.studenterp.repository.DepartmentRepository;
import com.erp.studenterp.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;

    private final DepartmentRepository departmentRepository;

    private final CourseRepository courseRepository;


    @Transactional
    public SubjectResponse createSubject(
            SubjectRequest request) {

        if (subjectRepository.existsBySubjectCode(
                request.getSubjectCode())) {

            throw new RuntimeException(
                    "Subject code already exists"
            );
        }

        Department department =
                departmentRepository
                        .findById(request.getDepartmentId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Department not found"
                                )
                        );

        Course course =
                courseRepository
                        .findById(request.getCourseId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Course not found"
                                )
                        );

        Subject subject = new Subject();

        copyRequest(
                request,
                subject,
                department,
                course
        );

        Subject saved =
                subjectRepository.save(subject);

        return SubjectMapper.toResponse(saved);
    }


    @Transactional(readOnly = true)
    public SubjectResponse getSubjectById(Long id) {

        Subject subject =
                getActiveSubject(id);

        return SubjectMapper.toResponse(subject);
    }


    @Transactional(readOnly = true)
    public List<SubjectResponse> getSubjects(
            Long courseId,
            Integer semester) {

        return subjectRepository
                .findByCourseIdAndSemesterAndActiveTrue(
                        courseId,
                        semester
                )
                .stream()
                .map(SubjectMapper::toResponse)
                .toList();
    }


    @Transactional
    public SubjectResponse updateSubject(
            Long id,
            SubjectRequest request) {

        Subject subject =
                getActiveSubject(id);

        if (subjectRepository
                .existsBySubjectCodeAndIdNot(
                        request.getSubjectCode(),
                        id
                )) {

            throw new RuntimeException(
                    "Subject code already exists"
            );
        }

        Department department =
                departmentRepository
                        .findById(request.getDepartmentId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Department not found"
                                )
                        );

        Course course =
                courseRepository
                        .findById(request.getCourseId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Course not found"
                                )
                        );

        copyRequest(
                request,
                subject,
                department,
                course
        );

        return SubjectMapper.toResponse(
                subjectRepository.save(subject)
        );
    }


    @Transactional
    public void deleteSubject(Long id) {

        Subject subject =
                getActiveSubject(id);

        subject.setActive(false);

        subjectRepository.save(subject);
    }


    private Subject getActiveSubject(Long id) {

        return subjectRepository
                .findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Subject not found with ID: " + id
                        )
                );
    }


    private void copyRequest(
            SubjectRequest request,
            Subject subject,
            Department department,
            Course course) {

        subject.setSubjectCode(
                request.getSubjectCode()
        );

        subject.setSubjectName(
                request.getSubjectName()
        );

        subject.setSemester(
                request.getSemester()
        );

        subject.setCredits(
                request.getCredits()
        );

        subject.setDepartment(department);

        subject.setCourse(course);
    }
}