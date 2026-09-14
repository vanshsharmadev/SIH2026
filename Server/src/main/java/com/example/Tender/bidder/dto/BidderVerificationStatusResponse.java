package com.example.Tender.bidder.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BidderVerificationStatusResponse {
    private String tempToken;
    private String legalName;
    private String email;
    private String gstNumber;
    private boolean gstVerified;
    private LocalDateTime gstVerifiedAt;
    private String message;
}
