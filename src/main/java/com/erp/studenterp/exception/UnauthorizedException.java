package com.erp.studenterp.exception;

import org.springframework.http.HttpStatus;

/** Credentials are missing or wrong. Rendered as HTTP 401. */
public class UnauthorizedException extends ApiException {

    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}
