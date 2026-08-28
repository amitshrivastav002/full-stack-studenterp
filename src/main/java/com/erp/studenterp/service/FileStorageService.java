package com.erp.studenterp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class FileStorageService {

    private final Path uploadPath;

    public FileStorageService(
            @Value("${file.upload-dir}") String uploadDir)
            throws IOException {

        this.uploadPath = Paths.get(uploadDir)
                .toAbsolutePath()
                .normalize();

        Files.createDirectories(this.uploadPath);
    }

    public StoredFile save(
            MultipartFile file,
            String folder) {

        try {

            if (file.isEmpty()) {
                throw new RuntimeException(
                        "Cannot upload an empty file"
                );
            }

            Path folderPath = uploadPath
                    .resolve(folder)
                    .normalize();

            Files.createDirectories(folderPath);

            String originalName =
                    file.getOriginalFilename();

            String extension = "";

            if (originalName != null) {

                int index = originalName.lastIndexOf(".");

                if (index >= 0) {
                    extension = originalName.substring(index);
                }
            }

            String storedName =
                    UUID.randomUUID() + extension;

            Path destination =
                    folderPath.resolve(storedName)
                            .normalize();

            if (!destination.startsWith(folderPath)) {
                throw new RuntimeException(
                        "Invalid file path"
                );
            }

            Files.copy(
                    file.getInputStream(),
                    destination,
                    StandardCopyOption.REPLACE_EXISTING
            );

            return new StoredFile(
                    originalName,
                    storedName,
                    destination.toString()
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Could not store file",
                    e
            );
        }
    }

    public record StoredFile(
            String originalName,
            String storedName,
            String path) {
    }
    public Path load(String filePath) {

    Path path = Paths.get(filePath)
            .toAbsolutePath()
            .normalize();

    if (!Files.exists(path)) {
        throw new RuntimeException("File not found");
    }

    if (!Files.isRegularFile(path)) {
        throw new RuntimeException("Invalid file");
    }

    return path;
}
}