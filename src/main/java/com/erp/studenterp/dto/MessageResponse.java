package com.erp.studenterp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Simple acknowledgement body for endpoints that have nothing else to return. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private String message;

    public static MessageResponse of(String message) {
        return new MessageResponse(message);
    }
}
