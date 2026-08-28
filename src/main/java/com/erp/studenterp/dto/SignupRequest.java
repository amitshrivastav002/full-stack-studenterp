package com.erp.studenterp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Public self-service sign-up.
 *
 * <p>Deliberately has no {@code role} field, unlike {@link RegisterRequest}.
 * This endpoint is open to anyone, so the role is fixed to STUDENT in the
 * service rather than read from the body — a caller must not be able to ask
 * for an administrator account.
 */
@Data
public class SignupRequest {

    @NotBlank
    private String fullName;

    @Email
    @NotBlank
    private String email;

    /** Longer than the admin-created minimum: nobody vets these accounts. */
    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
