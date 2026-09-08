package com.example.Tender.bidder.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BidderVerifyOtpRequest {

    private String email;

    private String tempToken;

    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be exactly 6 numeric digits")
    private String otp;

    public BidderVerifyOtpRequest(String email, String otp) {
        this.email = email;
        this.otp = otp;
    }
}
