package com.example.Tender.bidder.exception;

public class BidderAlreadyExistsException extends IllegalArgumentException {

    public BidderAlreadyExistsException(String message) {
        super(message);
    }
}
