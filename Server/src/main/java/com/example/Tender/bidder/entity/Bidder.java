package com.example.Tender.bidder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bidders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bidder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 1. Authorized Person Name (e.g. Rahul Sharma)
     */
    @Column(name = "authorized_person_name")
    private String authorizedPersonName;

    @Column(name = "legal_name", nullable = false)
    private String legalName;

    public String getAuthorizedPersonName() {
        if (authorizedPersonName != null && !authorizedPersonName.trim().isEmpty()) {
            return authorizedPersonName;
        }
        return legalName;
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

    /**
     * 2. Company / Organization Name (e.g. Apex Infotech Ltd)
     */
    @Column(name = "company_name")
    private String companyName;

    public String getCompanyName() {
        if (companyName != null && !companyName.trim().isEmpty()) {
            return companyName;
        }
        return getAuthorizedPersonName();
    }

    /**
     * 3. Official Business Email
     */
    @Column(nullable = false, unique = true)
    private String email;

    /**
     * 4. Mobile Number
     */
    @Column(name = "phone")
    private String phone;

    /**
     * 5. GSTIN Number (e.g. 09ARNAV9012H3Z7)
     */
    @Column(name = "gst_number", unique = true, nullable = false)
    private String gstNumber;

    /**
     * 6. Password (BCrypt Hashed)
     */
    @Column(nullable = false)
    private String password;

    /**
     * Role & Essential Status Flags
     */
    @Builder.Default
    @Column(name = "role", length = 20, nullable = true)
    private String role = "BIDDER";

    public String getRole() {
        return (role != null && !role.trim().isEmpty()) ? role : "BIDDER";
    }

    @Builder.Default
    private boolean isVerified = false;

    @Builder.Default
    private boolean gstVerified = false;

    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "pan_number")
    private String panNumber;

    @Builder.Default
    @Column(name = "pan_verified", nullable = false)
    private boolean panVerified = false;

    @Column(name = "pan_verified_at")
    private LocalDateTime panVerifiedAt;

    @Column(name = "udyam_number")
    private String udyamNumber;

    @Builder.Default
    @Column(name = "udyam_verified", nullable = false)
    private boolean udyamVerified = false;

    @Column(name = "udyam_verified_at")
    private LocalDateTime udyamVerifiedAt;

    @Column(name = "address")
    private String address;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "profile_metadata", columnDefinition = "text")
    private String profileMetadata;

    private LocalDateTime gstVerifiedAt;

    private LocalDateTime emailVerifiedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (legalName == null && authorizedPersonName != null) {
            legalName = authorizedPersonName;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // -------------------------------------------------------------
    // Helper accessors for backward-compatibility with services
    // -------------------------------------------------------------
    @Transient
    public String getPanNumber() {
        if (gstNumber != null && gstNumber.length() >= 12) {
            return gstNumber.substring(2, 12);
        }
        return null;
    }

    public void setPanNumber(String panNumber) {
        // Derived from GSTIN, no standalone column needed
    }

    @Transient
    public String getUdyamNumber() {
        return null;
    }

    public void setUdyamNumber(String udyamNumber) {
    }

    @Transient
    public String getRegistrationNumber() {
        return null;
    }

    public void setRegistrationNumber(String registrationNumber) {
    }

    @Transient
    public String getAddress() {
        return null;
    }

    public void setAddress(String address) {
    }

    @Transient
    public String getProfileMetadata() {
        return null;
    }

    public void setProfileMetadata(String profileMetadata) {
    }

    @Transient
    public boolean isPanVerified() {
        return gstVerified;
    }

    public void setPanVerified(boolean panVerified) {
    }

    @Transient
    public boolean isUdyamVerified() {
        return false;
    }

    public void setUdyamVerified(boolean udyamVerified) {
    }
}