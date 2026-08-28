package com.erp.studenterp.exception;

import org.springframework.http.HttpStatus;

/** Base for failures that carry an intended HTTP status. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
