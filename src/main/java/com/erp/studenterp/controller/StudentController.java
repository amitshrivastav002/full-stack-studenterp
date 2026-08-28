package com.erp.studenterp.controller;

import com.erp.studenterp.dto.StudentRequest;
import com.erp.studenterp.dto.StudentResponse;
import com.erp.studenterp.service.StudentService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;


    // CREATE

    @PostMapping
    public StudentResponse createStudent(
            @Valid
            @RequestBody StudentRequest request) {

        return studentService.addStudent(request);
    }


    // GET ALL

    @GetMapping
    public Page<StudentResponse> getAllStudents(

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size,

            @RequestParam(defaultValue = "id")
            String sortBy,

            @RequestParam(defaultValue = "asc")
            String direction) {

        return studentService.getAllStudents(
                page,
                size,
                sortBy,
                direction
        );
    }


    // SEARCH

    @GetMapping("/search")
    public List<StudentResponse> searchStudents(
            @RequestParam String keyword) {

        return studentService
                .searchStudents(keyword);
    }


    // GET BY ID

    @GetMapping("/{id}")
    public StudentResponse getStudentById(
            @PathVariable Long id) {

        return studentService
                .getStudentById(id);
    }


    // UPDATE

    @PutMapping("/{id}")
    public StudentResponse updateStudent(

            @PathVariable Long id,

            @Valid
            @RequestBody StudentRequest request) {

        return studentService
                .updateStudent(id, request);
    }


    // DELETE

    @DeleteMapping("/{id}")
    public String deleteStudent(
            @PathVariable Long id) {

        studentService.deleteStudent(id);

        return "Student deleted successfully";
    }


    // UPLOAD PHOTO

    @PostMapping(
            value = "/{id}/photo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public StudentResponse uploadPhoto(

            @PathVariable Long id,

            @RequestParam("file")
            MultipartFile file) {

        return studentService
                .uploadPhoto(id, file);
    }
}