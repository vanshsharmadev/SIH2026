package com.example.Tender.bidder.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderInitiateResponse {
    private String tempToken;
    private String email;
    private String legalName;
    private String panNumber;
    private String gstNumber;
    private String udyamNumber;
    private String message;
}
