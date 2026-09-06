package com.example.Tender.bidder.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BidderAuthResponse {

    private String token;
    @Builder.Default
    private String type = "Bearer";
    private Long bidderId;
    private String email;
    private String legalName;
    private String phone;
    private String gstNumber;
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