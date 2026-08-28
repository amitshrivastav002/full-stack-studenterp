package com.erp.studenterp.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/** Single error shape returned by every failing endpoint. */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    private LocalDateTime timestamp;

    private int status;

    /** Reason phrase, e.g. "Not Found". */
    private String error;

    /** Human readable message; also mirrored so older clients reading `error` still work. */
    private String message;

    private String path;

    /** Field name -> validation message, present only on validation failures. */
    private Map<String, String> fieldErrors;
}
