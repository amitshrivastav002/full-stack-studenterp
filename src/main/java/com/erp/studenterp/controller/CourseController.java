package com.erp.studenterp.controller;

import com.erp.studenterp.entity.Course;
import com.erp.studenterp.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseRepository courseRepository;

    @PostMapping
    public Course createCourse(
            @RequestBody Course course) {

        return courseRepository.save(course);
    }

    @GetMapping
    public List<Course> getAllCourses() {

        return courseRepository.findAll();
    }
}