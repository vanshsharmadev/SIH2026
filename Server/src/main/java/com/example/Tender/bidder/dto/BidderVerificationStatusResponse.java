package com.example.Tender.bidder.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderVerificationStatusResponse {
    private String tempToken;
    private String legalName;
    private String email;
    private String panNumber;
    private String gstNumber;
    private String udyamNumber;
    private boolean panVerified;
    private boolean gstVerified;
    private boolean udyamVerified;
    private boolean allBusinessVerified;
    private LocalDateTime panVerifiedAt;
    private LocalDateTime gstVerifiedAt;
    private LocalDateTime udyamVerifiedAt;
    private String message;
}
