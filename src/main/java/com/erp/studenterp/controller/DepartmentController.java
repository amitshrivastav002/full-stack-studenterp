package com.erp.studenterp.controller;

import com.erp.studenterp.entity.Department;
import com.erp.studenterp.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    @PostMapping
    public Department createDepartment(
            @RequestBody Department department) {

        return departmentRepository.save(department);
    }

    @GetMapping
    public List<Department> getAllDepartments() {

        return departmentRepository.findAll();
    }
}