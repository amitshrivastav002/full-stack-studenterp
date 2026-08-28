package com.erp.studenterp.exception;

import org.springframework.http.HttpStatus;

/** The caller is authenticated but not allowed to touch this record. HTTP 403. */
public class ForbiddenException extends ApiException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
