package com.erp.studenterp.service;

import com.erp.studenterp.dto.FileDownload;
import com.erp.studenterp.dto.StudentRequest;
import com.erp.studenterp.dto.StudentResponse;
import com.erp.studenterp.entity.Course;
import com.erp.studenterp.entity.Department;
import com.erp.studenterp.entity.Student;
import com.erp.studenterp.mapper.StudentMapper;
import com.erp.studenterp.repository.CourseRepository;
import com.erp.studenterp.repository.DepartmentRepository;
import com.erp.studenterp.repository.StudentRepository;

import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final FileStorageService fileStorageService;
    private final FeeService feeService;


    // =========================================================
    // 1. CREATE STUDENT
    // =========================================================

    @Transactional
    public StudentResponse addStudent(StudentRequest request) {

        // Check duplicate email
        if (studentRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException(
                    "Student email already exists"
            );
        }

        // Check duplicate enrollment number
        if (studentRepository.existsByEnrollmentNumber(
                request.getEnrollmentNumber())) {

            throw new RuntimeException(
                    "Enrollment number already exists"
            );
        }

        // Find department
        Department department = departmentRepository
                .findById(request.getDepartmentId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Department not found with ID: "
                                        + request.getDepartmentId()
                        )
                );

        // Find course
        Course course = courseRepository
                .findById(request.getCourseId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Course not found with ID: "
                                        + request.getCourseId()
                        )
                );

        Student student = new Student();

        copyRequestToStudent(
                request,
                student,
                department,
                course
        );

        Student savedStudent =
                studentRepository.save(student);

        // Fee records are created as part of enrolment, so a newly-created
        // student can be charged without a separate manual assignment step.
        feeService.assignActiveFeesToStudent(savedStudent.getId());

        return StudentMapper.toResponse(savedStudent);
    }


    // =========================================================
    // 2. GET STUDENT BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {

        Student student = studentRepository
                .findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Student not found with ID: " + id
                        )
                );

        return StudentMapper.toResponse(student);
    }


    // =========================================================
    // 3. GET ALL STUDENTS WITH PAGINATION + SORTING
    // =========================================================

    @Transactional(readOnly = true)
    public Page<StudentResponse> getAllStudents(
            int page,
            int size,
            String sortBy,
            String direction) {

        if (page < 0) {
            throw new RuntimeException(
                    "Page number cannot be negative"
            );
        }

        if (size <= 0) {
            throw new RuntimeException(
                    "Page size must be greater than 0"
            );
        }

        Sort sort;

        if ("desc".equalsIgnoreCase(direction)) {

            sort = Sort.by(sortBy).descending();

        } else {

            sort = Sort.by(sortBy).ascending();
        }

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        sort
                );

        Page<Student> students =
                studentRepository.findByActiveTrue(pageable);

        return students.map(StudentMapper::toResponse);
    }


    // =========================================================
    // 4. UPDATE STUDENT
    // =========================================================

    @Transactional
    public StudentResponse updateStudent(
            Long id,
            StudentRequest request) {

        Student student = studentRepository
                .findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Student not found with ID: " + id
                        )
                );

        Department department = departmentRepository
                .findById(request.getDepartmentId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Department not found with ID: "
                                        + request.getDepartmentId()
                        )
                );

        Course course = courseRepository
                .findById(request.getCourseId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Course not found with ID: "
                                        + request.getCourseId()
                        )
                );

        copyRequestToStudent(
                request,
                student,
                department,
                course
        );

        Student updatedStudent =
                studentRepository.save(student);

        return StudentMapper.toResponse(updatedStudent);
    }


    // =========================================================
    // 5. SOFT DELETE STUDENT
    // =========================================================

    @Transactional
    public void deleteStudent(Long id) {

        Student student = studentRepository
                .findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Student not found with ID: " + id
                        )
                );

        student.setActive(false);

        studentRepository.save(student);
    }


    // =========================================================
    // 6. SEARCH STUDENTS
    // =========================================================

    @Transactional(readOnly = true)
    public List<StudentResponse> searchStudents(
            String keyword) {

        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }

        return studentRepository
                .searchStudents(keyword.trim())
                .stream()
                .map(StudentMapper::toResponse)
                .toList();
    }


    // =========================================================
    // 7. UPLOAD PROFILE PHOTO
    // =========================================================

    @Transactional
    public StudentResponse uploadPhoto(
            Long studentId,
            MultipartFile file) {

        Student student = studentRepository
                .findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Student not found with ID: "
                                        + studentId
                        )
                );

        if (file == null || file.isEmpty()) {
            throw new RuntimeException(
                    "Photo cannot be empty"
            );
        }

        String contentType =
                file.getContentType();

        if (!"image/jpeg".equals(contentType)
                && !"image/png".equals(contentType)) {

            throw new RuntimeException(
                    "Only JPG and PNG photos are allowed"
            );
        }

        FileStorageService.StoredFile stored =
                fileStorageService.save(
                        file,
                        "students/"
                                + studentId
                                + "/photo"
                );

        String photoUrl =
                "/api/files/students/"
                        + studentId
                        + "/photo/"
                        + stored.storedName();

        student.setPhotoUrl(photoUrl);
        student.setPhotoPath(stored.path());

        Student savedStudent =
                studentRepository.save(student);

        return StudentMapper.toResponse(savedStudent);
    }


    // =========================================================
    // PRIVATE HELPER METHOD
    // =========================================================

    private void copyRequestToStudent(
            StudentRequest request,
            Student student,
            Department department,
            Course course) {

        student.setEnrollmentNumber(
                request.getEnrollmentNumber()
        );

        student.setFirstName(
                request.getFirstName()
        );

        student.setLastName(
                request.getLastName()
        );

        student.setEmail(
                request.getEmail()
        );

        student.setMobileNumber(
                request.getMobileNumber()
        );

        student.setDateOfBirth(
                request.getDateOfBirth()
        );

        student.setGender(
                request.getGender()
        );

        student.setBloodGroup(
                request.getBloodGroup()
        );

        student.setAddress(
                request.getAddress()
        );

        student.setCity(
                request.getCity()
        );

        student.setState(
                request.getState()
        );

        student.setPincode(
                request.getPincode()
        );

        student.setGuardianName(
                request.getGuardianName()
        );

        student.setGuardianMobile(
                request.getGuardianMobile()
        );

        student.setSemester(
                request.getSemester()
        );

        student.setSection(
                request.getSection()
        );

        student.setDepartment(department);

        student.setCourse(course);
    }
    @Transactional(readOnly = true)
public FileDownload getStudentPhoto(Long studentId) {

    Student student = studentRepository
            .findByIdAndActiveTrue(studentId)
            .orElseThrow(() ->
                    new RuntimeException(
                            "Student not found"
                    )
            );

    if (student.getPhotoPath() == null) {

        throw new RuntimeException(
                "Student photo not found"
        );
    }

    Path path =
            fileStorageService.load(
                    student.getPhotoPath()
            );

    String contentType;

    try {

        contentType =
                Files.probeContentType(path);

    } catch (IOException e) {

        contentType =
                "application/octet-stream";
    }

    return new FileDownload(
            path,
            path.getFileName().toString(),
            contentType
    );
}
}
