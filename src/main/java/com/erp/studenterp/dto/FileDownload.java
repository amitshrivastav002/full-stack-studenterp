package com.erp.studenterp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;

import java.nio.file.Path;
@Data
@Getter
@AllArgsConstructor
public class FileDownload {

    private Path path;

    private String originalFileName;

    private String contentType;
}