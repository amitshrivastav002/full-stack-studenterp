package com.erp.studenterp.controller;
import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.LeaveStatus;
import com.erp.studenterp.service.StudentLeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/faculty/leaves") @RequiredArgsConstructor
public class FacultyLeaveController {
    private final StudentLeaveService leaveService;
    @GetMapping public List<StudentLeaveResponse> all(Authentication auth, @RequestParam(required=false) LeaveStatus status) { return leaveService.facultyLeaves(auth.getName(), status); }
    @PutMapping("/{leaveId}/decision") public StudentLeaveResponse decide(@PathVariable Long leaveId, Authentication auth, @Valid @RequestBody LeaveDecisionRequest request) { return leaveService.decideAsFaculty(leaveId, auth.getName(), request); }
}
