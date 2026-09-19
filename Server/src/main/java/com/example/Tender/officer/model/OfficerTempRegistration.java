package com.example.Tender.officer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "officer_temp_registrations", indexes = {
    @Index(name = "idx_temp_officer_email", columnList = "email"),
    @Index(name = "idx_temp_officer_token", columnList = "temp_token")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfficerTempRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 20)
    private String mobile;

    @Column(nullable = false)
    private String password;

    @Column(name = "temp_token", length = 64)
    private String tempToken;

    @Builder.Default
    @Column(name = "identity_verified")
    private Boolean identityVerified = false;

    public boolean isIdentityVerified() {
        return Boolean.TRUE.equals(this.identityVerified);
    }

    @Column(name = "digilocker_id", length = 100)
    private String digilockerId;

    @Column(name = "identity_provider", length = 50)
    private String identityProvider;

    @Column(name = "identity_verified_at")
    private LocalDateTime identityVerifiedAt;

    @Column(name = "expiry_time", nullable = false)
    private LocalDateTime expiryTime;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
