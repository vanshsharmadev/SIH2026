package com.example.Tender.bidder.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyForgotPasswordOtpRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String otp;
}