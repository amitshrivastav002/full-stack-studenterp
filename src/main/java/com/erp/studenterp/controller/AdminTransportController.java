package com.erp.studenterp.controller;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.service.TransportService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/transport")
@RequiredArgsConstructor
public class AdminTransportController {

    private final TransportService transportService;

    @PostMapping("/routes")
    @ResponseStatus(HttpStatus.CREATED)
    public TransportRouteResponse createRoute(@Valid @RequestBody TransportRouteRequest request) {
        return transportService.createRoute(request);
    }

    @GetMapping("/routes")
    public List<TransportRouteResponse> routes() {
        return transportService.routes();
    }

    @PutMapping("/routes/{id}")
    public TransportRouteResponse updateRoute(
            @PathVariable Long id,
            @Valid @RequestBody TransportRouteRequest request) {

        return transportService.updateRoute(id, request);
    }

    @DeleteMapping("/routes/{id}")
    public MessageResponse deleteRoute(@PathVariable Long id) {
        transportService.deleteRoute(id);
        return MessageResponse.of("Route removed successfully");
    }

    @PostMapping("/routes/{routeId}/stops")
    @ResponseStatus(HttpStatus.CREATED)
    public TransportStopResponse addStop(
            @PathVariable Long routeId,
            @Valid @RequestBody TransportStopRequest request) {

        return transportService.addStop(routeId, request);
    }

    @DeleteMapping("/stops/{stopId}")
    public MessageResponse deleteStop(@PathVariable Long stopId) {
        transportService.deleteStop(stopId);
        return MessageResponse.of("Stop removed successfully");
    }

    @PostMapping("/assignments")
    @ResponseStatus(HttpStatus.CREATED)
    public TransportAssignmentResponse assign(
            @Valid @RequestBody TransportAssignmentRequest request) {

        return transportService.assign(request);
    }

    @GetMapping("/assignments")
    public List<TransportAssignmentResponse> assignments(
            @RequestParam(required = false, defaultValue = "true") Boolean activeOnly) {

        return transportService.assignments(activeOnly);
    }

    @PutMapping("/assignments/{assignmentId}/release")
    public TransportAssignmentResponse release(@PathVariable Long assignmentId) {
        return transportService.release(assignmentId);
    }
}
