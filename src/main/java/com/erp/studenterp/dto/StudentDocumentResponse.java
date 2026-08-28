package com.erp.studenterp.dto;

import com.erp.studenterp.entity.DocumentType;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDocumentResponse {

    private Long id;

    private String originalFileName;

    private String fileUrl;

    private String contentType;

    private Long fileSize;

    private DocumentType documentType;
}