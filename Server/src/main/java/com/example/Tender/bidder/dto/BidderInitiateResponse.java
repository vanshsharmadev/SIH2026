package com.example.Tender.bidder.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BidderInitiateResponse {
    private String tempToken;
    private String email;
    private String legalName;
    private String companyName;
    private String gstNumber;
    private String message;
}
