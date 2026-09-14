package com.example.Tender.bidder.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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

    private String companyName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 40, message = "Password must be between 8 and 40 characters")
    private String password;

    @NotBlank(message = "GST number is required")
    private String gstNumber;

    private String phone;

    public String getLegalName() {
        if (legalName != null && !legalName.trim().isEmpty()) {
            return legalName;
        }
        return companyName;
    }

    public String getCompanyName() {
        if (companyName != null && !companyName.trim().isEmpty()) {
            return companyName;
        }
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
        if ((this.companyName == null || this.companyName.trim().isEmpty()) && legalName != null) {
            this.companyName = legalName;
        }
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
        if ((this.legalName == null || this.legalName.trim().isEmpty()) && companyName != null) {
            this.legalName = companyName;
        }
    }
}