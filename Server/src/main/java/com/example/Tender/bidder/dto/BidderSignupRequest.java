package com.example.Tender.bidder.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderSignupRequest {

    @NotBlank(message = "Legal company / bidder name is required")
    private String legalName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 40, message = "Password must be between 8 and 40 characters")
    private String password;

    private String phone;

    private String address;

    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "Invalid PAN format (e.g. ABCDE1234F)")
    private String panNumber;

    @NotBlank(message = "GST number is required")
    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", message = "Invalid GSTIN format (e.g. 27ABCDE1234F1Z5)")
    private String gstNumber;

    @NotBlank
    @Pattern(
            regexp = "^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$",
            message = "Invalid Udyam number format"
    )
    private String udyamNumber;
    private String registrationNumber;
}