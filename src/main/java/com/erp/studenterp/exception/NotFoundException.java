package com.erp.studenterp.exception;

import org.springframework.http.HttpStatus;

/** The requested record does not exist. Rendered as HTTP 404. */
public class NotFoundException extends ApiException {

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }

    public static NotFoundException of(String entity, Object id) {
        return new NotFoundException(entity + " " + id + " was not found");
    }
}
