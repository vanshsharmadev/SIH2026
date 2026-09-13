package com.example.Tender.bidder.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateBidderRequest {

    private String legalName;
    private String companyName;
    private String panNumber;
    private String gstNumber;
    private String udyamNumber;
    private String registrationNumber;
    private String email;
    private String phone;
    private String address;
    private String profileMetadata;
}