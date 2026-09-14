package com.example.Tender.bidder.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BidderChatException extends RuntimeException {

    private final HttpStatus status;
    private final String error;
    private final String details;

    public BidderChatException(HttpStatus status, String error, String message) {
        super(message);
        this.status = status;
        this.error = error;
        this.details = null;
    }

    public BidderChatException(HttpStatus status, String error, String message, String details) {
        super(message);
        this.status = status;
        this.error = error;
        this.details = details;
    }

    public BidderChatException(HttpStatus status, String error, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.error = error;
        this.details = cause != null ? cause.getMessage() : null;
    }
}
