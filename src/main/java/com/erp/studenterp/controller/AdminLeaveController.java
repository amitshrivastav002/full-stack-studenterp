package com.erp.studenterp.controller;
import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.LeaveStatus;
import com.erp.studenterp.service.StudentLeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/admin/leaves") @RequiredArgsConstructor
public class AdminLeaveController {
    private final StudentLeaveService leaveService;
    @GetMapping public List<StudentLeaveResponse> all(@RequestParam(required=false) LeaveStatus status) { return leaveService.adminLeaves(status); }
    @PutMapping("/{leaveId}/decision") public StudentLeaveResponse decide(@PathVariable Long leaveId, Authentication auth, @Valid @RequestBody LeaveDecisionRequest request) { return leaveService.decide(leaveId, auth.getName(), request); }
}
