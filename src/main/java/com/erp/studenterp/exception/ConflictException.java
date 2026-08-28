package com.erp.studenterp.exception;

import org.springframework.http.HttpStatus;

/** The request clashes with existing data (duplicate, double booking). HTTP 409. */
public class ConflictException extends ApiException {

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
