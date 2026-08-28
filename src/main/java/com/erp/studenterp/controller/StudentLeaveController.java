package com.erp.studenterp.controller;
import com.erp.studenterp.dto.*;
import com.erp.studenterp.service.StudentLeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/student/leaves") @RequiredArgsConstructor
public class StudentLeaveController {
    private final StudentLeaveService leaveService;
    @PostMapping public StudentLeaveResponse apply(Authentication auth, @Valid @RequestBody StudentLeaveRequest request) { return leaveService.apply(auth.getName(), request); }
    @GetMapping public List<StudentLeaveResponse> mine(Authentication auth) { return leaveService.myLeaves(auth.getName()); }
}
