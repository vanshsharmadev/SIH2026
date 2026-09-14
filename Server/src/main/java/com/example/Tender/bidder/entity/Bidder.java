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

    @Column(nullable = false)
    private String legalName;

    @Column(name = "company_name")
    private String companyName;

    public String getCompanyName() {
        return (companyName != null && !companyName.trim().isEmpty()) ? companyName : legalName;
    }

    @Column(unique = true, nullable = true)
    private String panNumber;

    @Column(unique = true)
    private String gstNumber;

    @Column(unique = true, nullable = true)
    private String udyamNumber;

    private String registrationNumber;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String password;

    private String phone;

    private String address;

    @Column(columnDefinition = "TEXT")
    private String profileMetadata;

    @Builder.Default
    @Column(name = "role", length = 20, nullable = true)
    private String role = "BIDDER";

    public String getRole() {
        return (role != null && !role.trim().isEmpty()) ? role : "BIDDER";
    }

    @Builder.Default
    private boolean isVerified = false;

    @Builder.Default
    private boolean panVerified = false;

    @Builder.Default
    private boolean gstVerified = false;

    @Builder.Default
    private boolean udyamVerified = false;

    @Builder.Default
    private boolean emailVerified = false;

    private LocalDateTime panVerifiedAt;

    private LocalDateTime gstVerifiedAt;

    private LocalDateTime udyamVerifiedAt;

    private LocalDateTime emailVerifiedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}