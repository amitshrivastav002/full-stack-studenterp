package com.erp.studenterp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** The ID token Google Identity Services hands the browser after sign-in. */
@Data
public class GoogleLoginRequest {

    @NotBlank
    private String idToken;
}
