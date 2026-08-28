package com.erp.studenterp.controller;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.service.TimetableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/timetable")
@RequiredArgsConstructor
public class TimetableController {
    private final TimetableService timetableService;
    @PostMapping public TimetableResponse create(@Valid @RequestBody TimetableRequest request) { return timetableService.create(request); }
    @PutMapping("/{id}") public TimetableResponse update(@PathVariable Long id, @Valid @RequestBody TimetableRequest request) { return timetableService.update(id, request); }
    @DeleteMapping("/{id}") public String delete(@PathVariable Long id) { timetableService.delete(id); return "Timetable entry deleted successfully"; }
    @GetMapping public List<TimetableResponse> classTimetable(@RequestParam Long courseId, @RequestParam Integer semester, @RequestParam String section, @RequestParam String academicYear) { return timetableService.getClassTimetable(courseId, semester, section, academicYear); }
    @GetMapping("/faculty/{facultyId}") public List<TimetableResponse> facultyTimetable(@PathVariable Long facultyId, @RequestParam String academicYear) { return timetableService.getFacultyTimetable(facultyId, academicYear); }
}
