package com.example.Tender.bidder.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderAuthResponse {

    private String token;
    @Builder.Default
    private String type = "Bearer";
    private Long bidderId;
    private String email;
    private String legalName;
    private String phone;
    private String panNumber;
    private String gstNumber;
    private String udyamNumber;
    private boolean isVerified;
    private String message;

    public BidderAuthResponse(String token, Long bidderId, String email, String legalName) {
        this.token = token;
        this.type = "Bearer";
        this.bidderId = bidderId;
        this.email = email;
        this.legalName = legalName;
        this.isVerified = true;
    }
}