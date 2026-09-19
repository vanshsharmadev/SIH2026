package com.example.Tender.bidder.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateBidderRequest {

    @NotBlank(message = "Legal name is required")
    private String legalName;

    @NotBlank(message = "PAN number is required")
    private String panNumber;

    @NotBlank(message = "GST number is required")
    private String gstNumber;

    @NotBlank(message = "Udyam number is required")
    private String udyamNumber;

    private String registrationNumber;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    private String address;

    private String profileMetadata;
}