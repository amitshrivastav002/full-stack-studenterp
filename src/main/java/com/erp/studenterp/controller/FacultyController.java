package com.erp.studenterp.controller;

import com.erp.studenterp.dto.FacultyRequest;
import com.erp.studenterp.dto.FacultyResponse;
import com.erp.studenterp.service.FacultyService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/faculty")
@RequiredArgsConstructor
public class FacultyController {

    private final FacultyService facultyService;

    @PostMapping
    public FacultyResponse createFaculty(
            @Valid
            @RequestBody FacultyRequest request) {

        return facultyService.createFaculty(request);
    }
    @GetMapping
    public Page<FacultyResponse> getAllFaculty(

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size,

            @RequestParam(defaultValue = "id")
            String sortBy,

            @RequestParam(defaultValue = "asc")
            String direction) {

        return facultyService.getAllFaculty(
                page,
                size,
                sortBy,
                direction
        );
    }


    @GetMapping("/search")
    public List<FacultyResponse> searchFaculty(
            @RequestParam String keyword) {

        return facultyService.searchFaculty(keyword);
    }


    @GetMapping("/{id}")
    public FacultyResponse getFacultyById(
            @PathVariable Long id) {

        return facultyService.getFacultyById(id);
    }


    @PutMapping("/{id}")
    public FacultyResponse updateFaculty(

            @PathVariable Long id,

            @Valid
            @RequestBody FacultyRequest request) {

        return facultyService.updateFaculty(
                id,
                request
        );
    }


    @DeleteMapping("/{id}")
    public String deleteFaculty(
            @PathVariable Long id) {

        facultyService.deleteFaculty(id);

        return "Faculty deleted successfully";
    }
}