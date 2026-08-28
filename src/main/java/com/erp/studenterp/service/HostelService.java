package com.erp.studenterp.service;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.entity.HostelAllocation;
import com.erp.studenterp.entity.HostelRoom;
import com.erp.studenterp.entity.Student;
import com.erp.studenterp.exception.BadRequestException;
import com.erp.studenterp.exception.ConflictException;
import com.erp.studenterp.exception.NotFoundException;
import com.erp.studenterp.repository.HostelAllocationRepository;
import com.erp.studenterp.repository.HostelRoomRepository;
import com.erp.studenterp.repository.StudentRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HostelService {

    private final HostelRoomRepository roomRepository;
    private final HostelAllocationRepository allocationRepository;
    private final StudentRepository studentRepository;

    // ------------------------------------------------------------------ rooms

    @Transactional
    public HostelRoomResponse createRoom(HostelRoomRequest request) {

        String block = request.getBlockName().trim();
        String number = request.getRoomNumber().trim();

        if (roomRepository.existsByBlockNameIgnoreCaseAndRoomNumberIgnoreCase(block, number)) {
            throw new ConflictException("Room " + number + " already exists in block " + block);
        }

        HostelRoom room = HostelRoom.builder()
                .blockName(block)
                .roomNumber(number)
                .roomType(request.getRoomType())
                .capacity(request.getCapacity())
                .occupied(0)
                .feePerYear(request.getFeePerYear())
                .active(true)
                .build();

        return toRoomResponse(roomRepository.save(room));
    }

    @Transactional
    public HostelRoomResponse updateRoom(Long id, HostelRoomRequest request) {

        HostelRoom room = requireRoom(id);

        String block = request.getBlockName().trim();
        String number = request.getRoomNumber().trim();

        if (roomRepository.existsByBlockNameIgnoreCaseAndRoomNumberIgnoreCaseAndIdNot(
                block, number, id)) {
            throw new ConflictException("Room " + number + " already exists in block " + block);
        }

        if (request.getCapacity() < room.getOccupied()) {
            throw new BadRequestException("This room already houses " + room.getOccupied()
                    + " students, so capacity cannot be lower");
        }

        room.setBlockName(block);
        room.setRoomNumber(number);
        room.setRoomType(request.getRoomType());
        room.setCapacity(request.getCapacity());
        room.setFeePerYear(request.getFeePerYear());

        return toRoomResponse(roomRepository.save(room));
    }

    @Transactional
    public void deleteRoom(Long id) {

        HostelRoom room = requireRoom(id);

        if (room.getOccupied() > 0) {
            throw new BadRequestException("This room cannot be removed while it is occupied");
        }

        room.setActive(false);
        roomRepository.save(room);
    }

    @Transactional(readOnly = true)
    public List<HostelRoomResponse> rooms() {
        return roomRepository.findByActiveTrueOrderByBlockNameAscRoomNumberAsc()
                .stream()
                .map(this::toRoomResponse)
                .toList();
    }

    // ------------------------------------------------------------ allocations

    @Transactional
    public HostelAllocationResponse allocate(HostelAllocationRequest request) {

        Student student = studentRepository.findByIdAndActiveTrue(request.getStudentId())
                .orElseThrow(() -> NotFoundException.of("Student", request.getStudentId()));

        HostelRoom room = requireRoom(request.getRoomId());

        allocationRepository.findByStudentIdAndActiveTrue(student.getId()).ifPresent(existing -> {
            throw new ConflictException("This student already holds room "
                    + existing.getRoom().getRoomNumber()
                    + " in block " + existing.getRoom().getBlockName());
        });

        if (room.getOccupied() >= room.getCapacity()) {
            throw new BadRequestException("This room is already full");
        }

        room.setOccupied(room.getOccupied() + 1);
        roomRepository.save(room);

        HostelAllocation allocation = HostelAllocation.builder()
                .student(student)
                .room(room)
                .allocatedOn(LocalDate.now())
                .remarks(request.getRemarks())
                .active(true)
                .build();

        return toAllocationResponse(allocationRepository.save(allocation));
    }

    @Transactional
    public HostelAllocationResponse vacate(Long allocationId) {

        HostelAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> NotFoundException.of("Hostel allocation", allocationId));

        if (!allocation.isActive()) {
            throw new ConflictException("This room has already been vacated");
        }

        allocation.setActive(false);
        allocation.setVacatedOn(LocalDate.now());

        HostelRoom room = allocation.getRoom();
        room.setOccupied(Math.max(0, room.getOccupied() - 1));
        roomRepository.save(room);

        return toAllocationResponse(allocationRepository.save(allocation));
    }

    @Transactional(readOnly = true)
    public List<HostelAllocationResponse> allocations(Boolean activeOnly) {

        List<HostelAllocation> allocations = Boolean.TRUE.equals(activeOnly)
                ? allocationRepository.findByActiveTrueOrderByAllocatedOnDescIdDesc()
                : allocationRepository.findAllByOrderByAllocatedOnDescIdDesc();

        return allocations.stream().map(this::toAllocationResponse).toList();
    }

    /** A student's own hostel history, newest first. */
    @Transactional(readOnly = true)
    public List<HostelAllocationResponse> studentAllocations(Long studentId) {
        return allocationRepository.findByStudentIdOrderByAllocatedOnDesc(studentId)
                .stream()
                .map(this::toAllocationResponse)
                .toList();
    }

    // ---------------------------------------------------------------- helpers

    private HostelRoom requireRoom(Long id) {
        return roomRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> NotFoundException.of("Hostel room", id));
    }

    private HostelRoomResponse toRoomResponse(HostelRoom room) {
        return HostelRoomResponse.builder()
                .id(room.getId())
                .blockName(room.getBlockName())
                .roomNumber(room.getRoomNumber())
                .roomType(room.getRoomType())
                .capacity(room.getCapacity())
                .occupied(room.getOccupied())
                .available(Math.max(0, room.getCapacity() - room.getOccupied()))
                .feePerYear(room.getFeePerYear())
                .active(room.isActive())
                .build();
    }

    private HostelAllocationResponse toAllocationResponse(HostelAllocation allocation) {

        Student student = allocation.getStudent();
        HostelRoom room = allocation.getRoom();

        return HostelAllocationResponse.builder()
                .id(allocation.getId())
                .studentId(student.getId())
                .enrollmentNumber(student.getEnrollmentNumber())
                .studentName(student.getFirstName()
                        + (student.getLastName() == null ? "" : " " + student.getLastName()))
                .roomId(room.getId())
                .blockName(room.getBlockName())
                .roomNumber(room.getRoomNumber())
                .roomType(room.getRoomType())
                .feePerYear(room.getFeePerYear())
                .allocatedOn(allocation.getAllocatedOn())
                .vacatedOn(allocation.getVacatedOn())
                .remarks(allocation.getRemarks())
                .active(allocation.isActive())
                .build();
    }
}
