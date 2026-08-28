package com.erp.studenterp.controller;

import com.erp.studenterp.dto.*;
import com.erp.studenterp.service.ExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/exams")
@RequiredArgsConstructor
public class ExamController {
    private final ExamService examService;

    @PostMapping public ExamResponse create(@Valid @RequestBody ExamRequest request) { return examService.createExam(request); }
    @GetMapping public List<ExamResponse> getAll(@RequestParam Long courseId, @RequestParam Integer semester, @RequestParam String academicYear) { return examService.getExams(courseId, semester, academicYear); }
    @PostMapping("/{examId}/subjects") public ExamSubjectResponse addSubject(@PathVariable Long examId, @Valid @RequestBody ExamSubjectRequest request) { return examService.addSubject(examId, request); }
    @GetMapping("/{examId}/subjects") public List<ExamSubjectResponse> getSubjects(@PathVariable Long examId) { return examService.getExamSubjects(examId); }
    @PutMapping("/subjects/{examSubjectId}/marks") public StudentMarkResponse saveMark(@PathVariable Long examSubjectId, @Valid @RequestBody StudentMarkRequest request) { return examService.saveMark(examSubjectId, request); }
    @GetMapping("/{examId}/results") public List<StudentExamResultResponse> results(@PathVariable Long examId) { return examService.getExamResults(examId); }
    @GetMapping("/{examId}/students/{studentId}/result") public StudentExamResultResponse studentResult(@PathVariable Long examId, @PathVariable Long studentId) { return examService.getStudentResult(examId, studentId); }
}
