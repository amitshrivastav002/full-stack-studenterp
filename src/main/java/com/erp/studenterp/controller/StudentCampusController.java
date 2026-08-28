package com.erp.studenterp.controller;

import com.erp.studenterp.dto.HostelAllocationResponse;
import com.erp.studenterp.dto.TransportAssignmentResponse;
import com.erp.studenterp.service.HostelService;
import com.erp.studenterp.service.ProfileService;
import com.erp.studenterp.service.TransportService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Read-only views of the student's own hostel and transport arrangements. */
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentCampusController {

    private final HostelService hostelService;
    private final TransportService transportService;
    private final ProfileService profileService;

    @GetMapping("/hostel")
    public List<HostelAllocationResponse> hostel(Authentication authentication) {
        return hostelService.studentAllocations(
                profileService.requireStudent(authentication.getName()).getId());
    }

    @GetMapping("/transport")
    public List<TransportAssignmentResponse> transport(Authentication authentication) {
        return transportService.studentAssignments(
                profileService.requireStudent(authentication.getName()).getId());
    }
}
