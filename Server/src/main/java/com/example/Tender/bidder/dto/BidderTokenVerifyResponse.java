package com.example.Tender.bidder.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BidderTokenVerifyResponse {
    private boolean valid;
    private String tokenType;
    private Long bidderId;
    private String email;
    private String legalName;
    private String gstNumber;
    private String phone;
    private Boolean isVerified;
    private String message;
}
