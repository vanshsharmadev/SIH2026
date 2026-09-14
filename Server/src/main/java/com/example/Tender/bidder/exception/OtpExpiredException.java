package com.example.Tender.bidder.exception;

public class OtpExpiredException extends IllegalArgumentException {

    public OtpExpiredException(String message) {
        super(message);
    }
}
