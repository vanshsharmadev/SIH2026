package com.example.Tender.bidder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequest {

    @NotBlank
    private String resetToken;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 40, message = "Password must be between 8 and 40 characters")
    private String newPassword;
}