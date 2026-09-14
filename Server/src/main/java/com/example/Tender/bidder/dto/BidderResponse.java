package com.example.Tender.bidder.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BidderResponse {

    private Long id;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}