package com.erp.studenterp.controller;

import com.erp.studenterp.dto.FileDownload;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/** Shared plumbing for endpoints that stream a stored file back to the browser. */
final class Downloads {

    private Downloads() {
    }

    static ResponseEntity<Resource> attachment(FileDownload file) {

        MediaType mediaType;
        try {
            mediaType = file.getContentType() == null
                    ? MediaType.APPLICATION_OCTET_STREAM
                    : MediaType.parseMediaType(file.getContentType());
        } catch (Exception ignored) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + file.getOriginalFileName() + "\"")
                .body(new FileSystemResource(file.getPath()));
    }
}
