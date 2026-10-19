package com.example.Tender.bidder.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
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

    /**
     * 1. Authorized Person Name (e.g. Rahul Sharma)
     */
    @JsonAlias({"authorizedPersonName", "authorized_person_name"})
    private String authorizedPersonName;

    @NotBlank(message = "Legal name is required")
    private String legalName;

    /**
     * 2. Company / Organization Name (e.g. Apex Infotech Ltd)
     */
    @JsonAlias({"companyName", "company_name", "organizationName", "organization_name"})
    private String companyName;

    /**
     * 3. Official Business Email
     */
    @NotBlank(message = "Official business email is required")
    @Email(message = "Invalid email format")
    private String email;

    /**
     * 4. Mobile Number
     */
    @JsonAlias({"phone", "mobile", "mobileNumber", "phoneNumber"})
    private String phone;

    /**
     * 5. GSTIN Number (e.g. 09ARNAV9012H3Z7)
     */
    @NotBlank(message = "GSTIN number is required")
    @JsonAlias({"gstNumber", "gstin", "gst_number", "gst"})
    private String gstNumber;

    /**
     * 6. Password (Minimum 6 characters as required by frontend)
     */
    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 40, message = "Password must be between 6 and 40 characters")
    private String password;

    /**
     * 7. Confirm Password
     */
    @JsonAlias({"confirmPassword", "confirm_password"})
    private String confirmPassword;

    public String getAuthorizedPersonName() {
        if (authorizedPersonName != null && !authorizedPersonName.trim().isEmpty()) {
            return authorizedPersonName;
        }
        return legalName;
    }

    public String getLegalName() {
        return getAuthorizedPersonName();
    }

    public void setAuthorizedPersonName(String authorizedPersonName) {
        this.authorizedPersonName = authorizedPersonName;
        if (this.legalName == null || this.legalName.trim().isEmpty()) {
            this.legalName = authorizedPersonName;
        }
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
        if (this.authorizedPersonName == null || this.authorizedPersonName.trim().isEmpty()) {
            this.authorizedPersonName = legalName;
        }
    }

    public String getCompanyName() {
        if (companyName != null && !companyName.trim().isEmpty()) {
            return companyName;
        }
        return getAuthorizedPersonName();
    }
}