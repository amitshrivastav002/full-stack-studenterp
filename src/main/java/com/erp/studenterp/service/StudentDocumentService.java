package com.erp.studenterp.service;

import com.erp.studenterp.dto.FileDownload;
import com.erp.studenterp.dto.StudentDocumentResponse;
import com.erp.studenterp.entity.DocumentType;
import com.erp.studenterp.entity.Student;
import com.erp.studenterp.entity.StudentDocument;
import com.erp.studenterp.repository.StudentDocumentRepository;
import com.erp.studenterp.repository.StudentRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentDocumentService {

    private final StudentRepository studentRepository;
    private final StudentDocumentRepository documentRepository;
    private final FileStorageService fileStorageService;


    // =========================================================
    // 1. UPLOAD DOCUMENT
    // =========================================================

    @Transactional
    public StudentDocumentResponse uploadDocument(
            Long studentId,
            DocumentType type,
            MultipartFile file) {

        // Find active student
        Student student = studentRepository
                .findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Student not found with ID: "
                                        + studentId
                        )
                );

        // Validate document
        validateFile(file);

        // Store actual file
        FileStorageService.StoredFile stored =
                fileStorageService.save(
                        file,
                        "students/"
                                + studentId
                                + "/documents"
                );

        // Create database record
        StudentDocument document =
                new StudentDocument();

        document.setOriginalFileName(
                stored.originalName()
        );

        document.setStoredFileName(
                stored.storedName()
        );

        document.setFilePath(
                stored.path()
        );

        document.setContentType(
                file.getContentType()
        );

        document.setFileSize(
                file.getSize()
        );

        document.setDocumentType(type);

        document.setStudent(student);

        StudentDocument savedDocument =
                documentRepository.save(document);

        return toResponse(savedDocument);
    }


    // =========================================================
    // 2. GET ALL DOCUMENTS OF STUDENT
    // =========================================================

    @Transactional(readOnly = true)
    public List<StudentDocumentResponse> getStudentDocuments(
            Long studentId) {

        // Check student exists
        studentRepository
                .findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Student not found with ID: "
                                        + studentId
                        )
                );

        return documentRepository
                .findByStudentId(studentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // =========================================================
    // 3. GET DOCUMENT FILE
    // =========================================================

    @Transactional(readOnly = true)
    public FileDownload getDocumentFile(
            Long studentId,
            Long documentId) {

        StudentDocument document =
                documentRepository
                        .findByIdAndStudentId(
                                documentId,
                                studentId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"
                                )
                        );

        Path path =
                fileStorageService.load(
                        document.getFilePath()
                );

        return new FileDownload(
                path,
                document.getOriginalFileName(),
                document.getContentType()
        );
    }


    // =========================================================
    // 4. DELETE DOCUMENT
    // =========================================================

    @Transactional
    public void deleteDocument(
            Long studentId,
            Long documentId) {

        StudentDocument document =
                documentRepository
                        .findByIdAndStudentId(
                                documentId,
                                studentId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"
                                )
                        );

        try {

            Files.deleteIfExists(
                    Paths.get(
                            document.getFilePath()
                    )
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Unable to delete document file",
                    e
            );
        }

        documentRepository.delete(document);
    }


    // =========================================================
    // 5. VALIDATE FILE
    // =========================================================

    private void validateFile(
            MultipartFile file) {

        if (file == null || file.isEmpty()) {

            throw new RuntimeException(
                    "File cannot be empty"
            );
        }

        String contentType =
                file.getContentType();

        if (contentType == null) {

            throw new RuntimeException(
                    "Unable to determine file type"
            );
        }

        boolean allowed =
                contentType.equals("application/pdf")
                        || contentType.equals("image/jpeg")
                        || contentType.equals("image/png");

        if (!allowed) {

            throw new RuntimeException(
                    "Only PDF, JPG and PNG files are allowed"
            );
        }
    }


    // =========================================================
    // 6. ENTITY -> RESPONSE DTO
    // =========================================================

    private StudentDocumentResponse toResponse(
            StudentDocument document) {

        Long studentId =
                document.getStudent().getId();

        String fileUrl =
                "/api/students/"
                        + studentId
                        + "/documents/"
                        + document.getId()
                        + "/file";

        return StudentDocumentResponse
                .builder()
                .id(document.getId())
                .originalFileName(
                        document.getOriginalFileName()
                )
                .fileUrl(fileUrl)
                .contentType(
                        document.getContentType()
                )
                .fileSize(
                        document.getFileSize()
                )
                .documentType(
                        document.getDocumentType()
                )
                .build();
    }
}