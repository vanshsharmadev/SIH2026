package com.example.Tender.bidder.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BidderAuthResponse {

    private String token;
    private Long bidderId;
    private String email;
    private String legalName;
}