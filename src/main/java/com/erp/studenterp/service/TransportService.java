package com.erp.studenterp.service;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.Student;
import com.erp.studenterp.entity.TransportAssignment;
import com.erp.studenterp.entity.TransportRoute;
import com.erp.studenterp.entity.TransportStop;
import com.erp.studenterp.exception.BadRequestException;
import com.erp.studenterp.exception.ConflictException;
import com.erp.studenterp.exception.NotFoundException;
import com.erp.studenterp.repository.StudentRepository;
import com.erp.studenterp.repository.TransportAssignmentRepository;
import com.erp.studenterp.repository.TransportRouteRepository;
import com.erp.studenterp.repository.TransportStopRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransportService {

    private final TransportRouteRepository routeRepository;
    private final TransportStopRepository stopRepository;
    private final TransportAssignmentRepository assignmentRepository;
    private final StudentRepository studentRepository;

    // ----------------------------------------------------------------- routes

    @Transactional
    public TransportRouteResponse createRoute(TransportRouteRequest request) {

        String code = request.getRouteCode().trim();

        if (routeRepository.existsByRouteCodeIgnoreCase(code)) {
            throw new ConflictException("Route " + code + " already exists");
        }

        TransportRoute route = TransportRoute.builder()
                .routeCode(code)
                .routeName(request.getRouteName().trim())
                .vehicleNumber(request.getVehicleNumber())
                .driverName(request.getDriverName())
                .driverMobile(request.getDriverMobile())
                .capacity(request.getCapacity())
                .occupied(0)
                .farePerYear(request.getFarePerYear())
                .active(true)
                .build();

        return toRouteResponse(routeRepository.save(route));
    }

    @Transactional
    public TransportRouteResponse updateRoute(Long id, TransportRouteRequest request) {

        TransportRoute route = requireRoute(id);
        String code = request.getRouteCode().trim();

        if (routeRepository.existsByRouteCodeIgnoreCaseAndIdNot(code, id)) {
            throw new ConflictException("Route " + code + " already exists");
        }

        if (request.getCapacity() < route.getOccupied()) {
            throw new BadRequestException("This route already carries " + route.getOccupied()
                    + " students, so capacity cannot be lower");
        }

        route.setRouteCode(code);
        route.setRouteName(request.getRouteName().trim());
        route.setVehicleNumber(request.getVehicleNumber());
        route.setDriverName(request.getDriverName());
        route.setDriverMobile(request.getDriverMobile());
        route.setCapacity(request.getCapacity());
        route.setFarePerYear(request.getFarePerYear());

        return toRouteResponse(routeRepository.save(route));
    }

    @Transactional
    public void deleteRoute(Long id) {

        TransportRoute route = requireRoute(id);

        if (route.getOccupied() > 0) {
            throw new BadRequestException(
                    "This route cannot be removed while students are assigned to it");
        }

        route.setActive(false);
        routeRepository.save(route);
    }

    @Transactional(readOnly = true)
    public List<TransportRouteResponse> routes() {
        return routeRepository.findByActiveTrueOrderByRouteCodeAsc()
                .stream()
                .map(this::toRouteResponse)
                .toList();
    }

    // ------------------------------------------------------------------ stops

    @Transactional
    public TransportStopResponse addStop(Long routeId, TransportStopRequest request) {

        TransportRoute route = requireRoute(routeId);

        TransportStop stop = TransportStop.builder()
                .route(route)
                .stopName(request.getStopName().trim())
                .pickupTime(request.getPickupTime())
                .dropTime(request.getDropTime())
                .active(true)
                .build();

        return toStopResponse(stopRepository.save(stop));
    }

    @Transactional
    public void deleteStop(Long stopId) {

        TransportStop stop = stopRepository.findByIdAndActiveTrue(stopId)
                .orElseThrow(() -> NotFoundException.of("Transport stop", stopId));

        stop.setActive(false);
        stopRepository.save(stop);
    }

    // ------------------------------------------------------------ assignments

    @Transactional
    public TransportAssignmentResponse assign(TransportAssignmentRequest request) {

        Student student = studentRepository.findByIdAndActiveTrue(request.getStudentId())
                .orElseThrow(() -> NotFoundException.of("Student", request.getStudentId()));

        TransportRoute route = requireRoute(request.getRouteId());

        assignmentRepository.findByStudentIdAndActiveTrue(student.getId()).ifPresent(existing -> {
            throw new ConflictException(
                    "This student is already assigned to route " + existing.getRoute().getRouteCode());
        });

        if (route.getOccupied() >= route.getCapacity()) {
            throw new BadRequestException("This route is already at capacity");
        }

        TransportStop stop = null;
        if (request.getStopId() != null) {
            stop = stopRepository.findByIdAndActiveTrue(request.getStopId())
                    .orElseThrow(() -> NotFoundException.of("Transport stop", request.getStopId()));

            if (!stop.getRoute().getId().equals(route.getId())) {
                throw new BadRequestException("That stop does not belong to the selected route");
            }
        }

        route.setOccupied(route.getOccupied() + 1);
        routeRepository.save(route);

        TransportAssignment assignment = TransportAssignment.builder()
                .student(student)
                .route(route)
                .stop(stop)
                .assignedOn(LocalDate.now())
                .active(true)
                .build();

        return toAssignmentResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public TransportAssignmentResponse release(Long assignmentId) {

        TransportAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> NotFoundException.of("Transport assignment", assignmentId));

        if (!assignment.isActive()) {
            throw new ConflictException("This assignment has already been released");
        }

        assignment.setActive(false);
        assignment.setReleasedOn(LocalDate.now());

        TransportRoute route = assignment.getRoute();
        route.setOccupied(Math.max(0, route.getOccupied() - 1));
        routeRepository.save(route);

        return toAssignmentResponse(assignmentRepository.save(assignment));
    }

    @Transactional(readOnly = true)
    public List<TransportAssignmentResponse> assignments(Boolean activeOnly) {

        List<TransportAssignment> assignments = Boolean.TRUE.equals(activeOnly)
                ? assignmentRepository.findByActiveTrueOrderByAssignedOnDescIdDesc()
                : assignmentRepository.findAllByOrderByAssignedOnDescIdDesc();

        return assignments.stream().map(this::toAssignmentResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TransportAssignmentResponse> studentAssignments(Long studentId) {
        return assignmentRepository.findByStudentIdOrderByAssignedOnDesc(studentId)
                .stream()
                .map(this::toAssignmentResponse)
                .toList();
    }

    // ---------------------------------------------------------------- helpers

    private TransportRoute requireRoute(Long id) {
        return routeRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> NotFoundException.of("Transport route", id));
    }

    private TransportRouteResponse toRouteResponse(TransportRoute route) {
        return TransportRouteResponse.builder()
                .id(route.getId())
                .routeCode(route.getRouteCode())
                .routeName(route.getRouteName())
                .vehicleNumber(route.getVehicleNumber())
                .driverName(route.getDriverName())
                .driverMobile(route.getDriverMobile())
                .capacity(route.getCapacity())
                .occupied(route.getOccupied())
                .available(Math.max(0, route.getCapacity() - route.getOccupied()))
                .farePerYear(route.getFarePerYear())
                .active(route.isActive())
                .stops(stopRepository
                        .findByRouteIdAndActiveTrueOrderByPickupTimeAscStopNameAsc(route.getId())
                        .stream()
                        .map(this::toStopResponse)
                        .toList())
                .build();
    }

    private TransportStopResponse toStopResponse(TransportStop stop) {
        return TransportStopResponse.builder()
                .id(stop.getId())
                .routeId(stop.getRoute().getId())
                .stopName(stop.getStopName())
                .pickupTime(stop.getPickupTime())
                .dropTime(stop.getDropTime())
                .build();
    }

    private TransportAssignmentResponse toAssignmentResponse(TransportAssignment assignment) {

        Student student = assignment.getStudent();
        TransportRoute route = assignment.getRoute();
        TransportStop stop = assignment.getStop();

        return TransportAssignmentResponse.builder()
                .id(assignment.getId())
                .studentId(student.getId())
                .enrollmentNumber(student.getEnrollmentNumber())
                .studentName(student.getFirstName()
                        + (student.getLastName() == null ? "" : " " + student.getLastName()))
                .routeId(route.getId())
                .routeCode(route.getRouteCode())
                .routeName(route.getRouteName())
                .vehicleNumber(route.getVehicleNumber())
                .driverName(route.getDriverName())
                .driverMobile(route.getDriverMobile())
                .stopId(stop == null ? null : stop.getId())
                .stopName(stop == null ? null : stop.getStopName())
                .pickupTime(stop == null ? null : stop.getPickupTime())
                .farePerYear(route.getFarePerYear())
                .assignedOn(assignment.getAssignedOn())
                .releasedOn(assignment.getReleasedOn())
                .active(assignment.isActive())
                .build();
    }
}
