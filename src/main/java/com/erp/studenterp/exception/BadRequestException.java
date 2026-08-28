package com.erp.studenterp.exception;

import org.springframework.http.HttpStatus;

/** The request is well formed but cannot be accepted. Rendered as HTTP 400. */
public class BadRequestException extends ApiException {

    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
