package com.erp.studenterp.controller;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.service.HostelService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/hostel")
@RequiredArgsConstructor
public class AdminHostelController {

    private final HostelService hostelService;

    @PostMapping("/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public HostelRoomResponse createRoom(@Valid @RequestBody HostelRoomRequest request) {
        return hostelService.createRoom(request);
    }

    @GetMapping("/rooms")
    public List<HostelRoomResponse> rooms() {
        return hostelService.rooms();
    }

    @PutMapping("/rooms/{id}")
    public HostelRoomResponse updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody HostelRoomRequest request) {

        return hostelService.updateRoom(id, request);
    }

    @DeleteMapping("/rooms/{id}")
    public MessageResponse deleteRoom(@PathVariable Long id) {
        hostelService.deleteRoom(id);
        return MessageResponse.of("Room removed successfully");
    }

    @PostMapping("/allocations")
    @ResponseStatus(HttpStatus.CREATED)
    public HostelAllocationResponse allocate(
            @Valid @RequestBody HostelAllocationRequest request) {

        return hostelService.allocate(request);
    }

    @GetMapping("/allocations")
    public List<HostelAllocationResponse> allocations(
            @RequestParam(required = false, defaultValue = "true") Boolean activeOnly) {

        return hostelService.allocations(activeOnly);
    }

    @PutMapping("/allocations/{allocationId}/vacate")
    public HostelAllocationResponse vacate(@PathVariable Long allocationId) {
        return hostelService.vacate(allocationId);
    }
}
