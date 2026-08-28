package com.erp.studenterp.controller;

import com.erp.studenterp.dto.ChangePasswordRequest;
import com.erp.studenterp.dto.MessageResponse;
import com.erp.studenterp.dto.NoticeResponse;
import com.erp.studenterp.dto.ProfileResponse;
import com.erp.studenterp.service.AuthService;
import com.erp.studenterp.service.NoticeService;
import com.erp.studenterp.service.ProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.erp.studenterp.dto.FileDownload;

import java.util.List;

/** Self-service endpoints available to every signed-in role. */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final ProfileService profileService;
    private final NoticeService noticeService;
    private final AuthService authService;

    @GetMapping
    public ProfileResponse profile(Authentication authentication) {
        return profileService.getProfile(authentication.getName());
    }

    @PutMapping("/password")
    public MessageResponse changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {

        authService.changePassword(
                authentication.getName(),
                request.getCurrentPassword(),
                request.getNewPassword());

        return MessageResponse.of("Password updated successfully");
    }

    /**
     * Replaces the caller's own profile photo.  Every signed-in role may do this
     * for themselves; the service picks the record that holds their photo.
     */
    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProfileResponse uploadPhoto(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {

        return profileService.uploadOwnPhoto(authentication.getName(), file);
    }

    /**
     * Streams the caller's own photo.  Served here rather than as a static file
     * so the bytes stay behind authentication, and inline so an <img> can use it.
     */
    @GetMapping("/photo")
    public ResponseEntity<Resource> photo(Authentication authentication) {

        FileDownload file = profileService.loadOwnPhoto(authentication.getName());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + file.getOriginalFileName() + "\"")
                .body(new FileSystemResource(file.getPath()));
    }

    /** The notice board filtered to what this role is allowed to see. */
    @GetMapping("/notices")
    public List<NoticeResponse> notices(Authentication authentication) {
        return noticeService.findForRole(
                profileService.requireUser(authentication.getName()).getRole());
    }
}
