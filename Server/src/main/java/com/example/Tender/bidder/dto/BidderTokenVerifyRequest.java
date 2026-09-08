package com.example.Tender.bidder.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderTokenVerifyRequest {
    private String token;
    private String tempToken;
}
