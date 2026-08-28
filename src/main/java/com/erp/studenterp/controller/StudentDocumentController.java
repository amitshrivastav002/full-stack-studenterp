package com.erp.studenterp.controller;

import com.erp.studenterp.dto.FileDownload;
import com.erp.studenterp.dto.StudentDocumentResponse;
import com.erp.studenterp.entity.DocumentType;
import com.erp.studenterp.service.StudentDocumentService;

import lombok.RequiredArgsConstructor;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentDocumentController {

    private final StudentDocumentService documentService;


    // =========================================================
    // 1. UPLOAD DOCUMENT
    // =========================================================

    @PostMapping(
            value = "/{studentId}/documents",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public StudentDocumentResponse uploadDocument(
            @PathVariable Long studentId,
            @RequestParam DocumentType type,
            @RequestParam("file") MultipartFile file) {

        return documentService.uploadDocument(
                studentId,
                type,
                file
        );
    }


    // =========================================================
    // 2. GET ALL DOCUMENTS OF A STUDENT
    // =========================================================

    @GetMapping("/{studentId}/documents")
    public List<StudentDocumentResponse> getDocuments(
            @PathVariable Long studentId) {

        return documentService.getStudentDocuments(studentId);
    }


    // =========================================================
    // 3. VIEW / DOWNLOAD DOCUMENT
    // =========================================================

    @GetMapping("/{studentId}/documents/{documentId}/file")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long studentId,
            @PathVariable Long documentId) {

        FileDownload file =
                documentService.getDocumentFile(
                        studentId,
                        documentId
                );

        Resource resource =
                new FileSystemResource(file.getPath());

        MediaType mediaType;

        try {

            if (file.getContentType() != null) {
                mediaType = MediaType.parseMediaType(
                        file.getContentType()
                );
            } else {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }

        } catch (Exception e) {

            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity
                .ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\""
                                + file.getOriginalFileName()
                                + "\""
                )
                .body(resource);
    }


    // =========================================================
    // 4. DELETE DOCUMENT
    // =========================================================

    @DeleteMapping("/{studentId}/documents/{documentId}")
    public String deleteDocument(
            @PathVariable Long studentId,
            @PathVariable Long documentId) {

        documentService.deleteDocument(
                studentId,
                documentId
        );

        return "Document deleted successfully";
    }
}