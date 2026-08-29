package com.example.Tender.bidder.exception;

public class BidderNotFoundException extends RuntimeException {

    public BidderNotFoundException(String message) {
        super(message);
    }
}