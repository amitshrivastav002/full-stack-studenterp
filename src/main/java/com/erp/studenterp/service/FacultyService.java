package com.erp.studenterp.service;

import com.erp.studenterp.dto.FacultyRequest;
import com.erp.studenterp.dto.FacultyResponse;

import com.erp.studenterp.entity.Department;
import com.erp.studenterp.entity.Faculty;

import com.erp.studenterp.mapper.FacultyMapper;

import com.erp.studenterp.repository.DepartmentRepository;
import com.erp.studenterp.repository.FacultyRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacultyService {

    private final FacultyRepository facultyRepository;

    private final DepartmentRepository departmentRepository;


    // CREATE

    @Transactional
    public FacultyResponse createFaculty(
            FacultyRequest request) {

        if (facultyRepository.existsByEmail(
                request.getEmail())) {

            throw new RuntimeException(
                    "Faculty email already exists"
            );
        }

        if (facultyRepository.existsByEmployeeId(
                request.getEmployeeId())) {

            throw new RuntimeException(
                    "Employee ID already exists"
            );
        }

        Department department =
                getDepartment(request.getDepartmentId());

        Faculty faculty = new Faculty();

        copyRequest(
                request,
                faculty,
                department
        );

        Faculty saved =
                facultyRepository.save(faculty);

        return FacultyMapper.toResponse(saved);
    }


    // GET BY ID

    @Transactional(readOnly = true)
    public FacultyResponse getFacultyById(Long id) {

        Faculty faculty =
                getActiveFaculty(id);

        return FacultyMapper.toResponse(faculty);
    }


    // GET ALL

    @Transactional(readOnly = true)
    public Page<FacultyResponse> getAllFaculty(
            int page,
            int size,
            String sortBy,
            String direction) {

        Sort sort =
                "desc".equalsIgnoreCase(direction)
                        ? Sort.by(sortBy).descending()
                        : Sort.by(sortBy).ascending();

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        sort
                );

        return facultyRepository
                .findByActiveTrue(pageable)
                .map(FacultyMapper::toResponse);
    }


    // UPDATE

    @Transactional
    public FacultyResponse updateFaculty(
            Long id,
            FacultyRequest request) {

        Faculty faculty =
                getActiveFaculty(id);

        if (facultyRepository.existsByEmailAndIdNot(
                request.getEmail(),
                id)) {

            throw new RuntimeException(
                    "Another faculty member uses this email"
            );
        }

        if (facultyRepository
                .existsByEmployeeIdAndIdNot(
                        request.getEmployeeId(),
                        id)) {

            throw new RuntimeException(
                    "Another faculty member uses this employee ID"
            );
        }

        Department department =
                getDepartment(request.getDepartmentId());

        copyRequest(
                request,
                faculty,
                department
        );

        Faculty saved =
                facultyRepository.save(faculty);

        return FacultyMapper.toResponse(saved);
    }


    // DELETE

    @Transactional
    public void deleteFaculty(Long id) {

        Faculty faculty =
                getActiveFaculty(id);

        faculty.setActive(false);

        facultyRepository.save(faculty);
    }


    // SEARCH

    @Transactional(readOnly = true)
    public List<FacultyResponse> searchFaculty(
            String keyword) {

        if (keyword == null ||
                keyword.isBlank()) {

            return List.of();
        }

        return facultyRepository
                .searchFaculty(keyword.trim())
                .stream()
                .map(FacultyMapper::toResponse)
                .toList();
    }


    // HELPER

    private Faculty getActiveFaculty(Long id) {

        return facultyRepository
                .findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Faculty not found with ID: "
                                        + id
                        )
                );
    }


    private Department getDepartment(Long id) {

        return departmentRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Department not found with ID: "
                                        + id
                        )
                );
    }


    private void copyRequest(
            FacultyRequest request,
            Faculty faculty,
            Department department) {

        faculty.setEmployeeId(
                request.getEmployeeId()
        );

        faculty.setFirstName(
                request.getFirstName()
        );

        faculty.setLastName(
                request.getLastName()
        );

        faculty.setEmail(
                request.getEmail()
        );

        faculty.setMobileNumber(
                request.getMobileNumber()
        );

        faculty.setDateOfBirth(
                request.getDateOfBirth()
        );

        faculty.setGender(
                request.getGender()
        );

        faculty.setDesignation(
                request.getDesignation()
        );

        faculty.setQualification(
                request.getQualification()
        );

        faculty.setJoiningDate(
                request.getJoiningDate()
        );

        faculty.setAddress(
                request.getAddress()
        );

        faculty.setCity(
                request.getCity()
        );

        faculty.setState(
                request.getState()
        );

        faculty.setPincode(
                request.getPincode()
        );

        faculty.setDepartment(department);
    }
    @Transactional(readOnly = true)
public FacultyResponse getFacultyByEmail(String email) {

    Faculty faculty = facultyRepository
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

    return FacultyMapper.toResponse(faculty);
}
}