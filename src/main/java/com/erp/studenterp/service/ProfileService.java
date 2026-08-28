package com.erp.studenterp.service;

import com.erp.studenterp.dto.FileDownload;
import com.erp.studenterp.dto.ProfileResponse;
import com.erp.studenterp.entity.Faculty;
import com.erp.studenterp.entity.Role;
import com.erp.studenterp.entity.Student;
import com.erp.studenterp.entity.User;
import com.erp.studenterp.exception.NotFoundException;
import com.erp.studenterp.repository.FacultyRepository;
import com.erp.studenterp.repository.StudentRepository;
import com.erp.studenterp.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

/**
 * Resolves the signed-in email into the user record plus the student or faculty
 * profile that hangs off it. Every portal needs this, so it lives in one place.
 */
@Service
@RequiredArgsConstructor
public class ProfileService {

    /**
     * Where the owner fetches their own photo.  Stored rather than a file path so
     * the client has a URL it can actually call, and so a non-null value is a
     * simple "this account has a photo" flag.
     */
    private static final String SELF_PHOTO_URL = "/api/me/photo";

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final StudentService studentService;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Account not found"));
    }

    @Transactional(readOnly = true)
    public Student requireStudent(String email) {
        return studentRepository.findByEmailAndActiveTrue(email)
                .orElseThrow(() -> new NotFoundException("Student profile not found"));
    }

    @Transactional(readOnly = true)
    public Faculty requireFaculty(String email) {
        return facultyRepository.findByUserEmail(email)
                .orElseThrow(() -> new NotFoundException("Faculty profile not found"));
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String email) {

        User user = requireUser(email);

        ProfileResponse.ProfileResponseBuilder profile = ProfileResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole());

        if (user.getRole() == Role.STUDENT) {
            studentRepository.findByEmailAndActiveTrue(email).ifPresent(student -> profile
                    .studentId(student.getId())
                    .enrollmentNumber(student.getEnrollmentNumber())
                    .semester(student.getSemester())
                    .section(student.getSection())
                    .courseName(student.getCourse() == null
                            ? null : student.getCourse().getCourseName())
                    .departmentName(student.getDepartment() == null
                            ? null : student.getDepartment().getDepartmentName())
                    .mobileNumber(student.getMobileNumber())
                    .photoUrl(student.getPhotoUrl()));
        }

        if (user.getRole() == Role.ADMIN) {
            profile.photoUrl(user.getPhotoUrl());
        }

        if (user.getRole() == Role.FACULTY) {
            facultyRepository.findByUserEmail(email).ifPresent(faculty -> profile
                    .facultyId(faculty.getId())
                    .employeeId(faculty.getEmployeeId())
                    .designation(faculty.getDesignation())
                    .departmentName(faculty.getDepartment() == null
                            ? null : faculty.getDepartment().getDepartmentName())
                    .mobileNumber(faculty.getMobileNumber())
                    .photoUrl(faculty.getPhotoUrl()));
        }

        return profile.build();
    }

    // ==========================================
    // PROFILE PHOTO SELF SERVICE
    // ==========================================

    /**
     * Replaces the signed-in user's own photo.  Each role keeps its photo on the
     * record that already owns it, so a student's self-service upload is the very
     * same picture the admin student list reads.
     */
    @Transactional
    public ProfileResponse uploadOwnPhoto(String email, MultipartFile file) {

        requireImage(file);

        User user = requireUser(email);

        if (user.getRole() == Role.STUDENT) {
            // Reuses the admin upload so both routes write one field.
            studentService.uploadPhoto(requireStudent(email).getId(), file);
            return getProfile(email);
        }

        if (user.getRole() == Role.FACULTY) {
            Faculty faculty = requireFaculty(email);
            FileStorageService.StoredFile stored = fileStorageService.save(
                    file, "faculty/" + faculty.getId() + "/photo");
            faculty.setPhotoUrl(SELF_PHOTO_URL);
            faculty.setPhotoPath(stored.path());
            facultyRepository.save(faculty);
            return getProfile(email);
        }

        FileStorageService.StoredFile stored = fileStorageService.save(
                file, "users/" + user.getId() + "/photo");
        user.setPhotoUrl(SELF_PHOTO_URL);
        user.setPhotoPath(stored.path());
        userRepository.save(user);
        return getProfile(email);
    }

    /** The signed-in user's own photo, resolved from whichever record holds it. */
    @Transactional(readOnly = true)
    public FileDownload loadOwnPhoto(String email) {

        User user = requireUser(email);

        String storedPath = switch (user.getRole()) {
            case STUDENT -> requireStudent(email).getPhotoPath();
            case FACULTY -> requireFaculty(email).getPhotoPath();
            default -> user.getPhotoPath();
        };

        if (storedPath == null || storedPath.isBlank()) {
            throw new NotFoundException("No profile photo has been uploaded yet");
        }

        Path path = fileStorageService.load(storedPath);
        String name = path.getFileName().toString();

        return new FileDownload(path, name,
                name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
    }

    private static void requireImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Photo cannot be empty");
        }
        String contentType = file.getContentType();
        if (!"image/jpeg".equals(contentType) && !"image/png".equals(contentType)) {
            throw new IllegalArgumentException("Only JPG and PNG photos are allowed");
        }
    }
}
