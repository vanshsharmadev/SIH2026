package com.example.Tender.bidder.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class BidderResponse {

    private Long id;
    private String legalName;
    private String panNumber;
    private String gstNumber;
    private String udyamNumber;
    private String registrationNumber;
    private String email;
    private String phone;
    private String address;
    private String profileMetadata;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}