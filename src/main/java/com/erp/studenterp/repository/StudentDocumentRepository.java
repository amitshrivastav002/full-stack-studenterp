package com.erp.studenterp.repository;

import com.erp.studenterp.entity.StudentDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentDocumentRepository
        extends JpaRepository<StudentDocument, Long> {

    List<StudentDocument> findByStudentId(Long studentId);

    Optional<StudentDocument> findByIdAndStudentId(
            Long documentId,
            Long studentId
    );
}