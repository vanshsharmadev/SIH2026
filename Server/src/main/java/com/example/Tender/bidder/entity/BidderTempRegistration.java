package com.example.Tender.bidder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bidder_temp_registrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderTempRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tempToken;

    @Column(nullable = false)
    private String legalName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;

    private String address;

    @Column(nullable = false)
    private String panNumber;

    @Column(nullable = false)
    private String gstNumber;

    private String udyamNumber;

    private String registrationNumber;

    @Builder.Default
    private boolean panVerified = false;

    @Builder.Default
    private boolean gstVerified = false;

    @Builder.Default
    private boolean udyamVerified = false;

    private LocalDateTime panVerifiedAt;

    private LocalDateTime gstVerifiedAt;

    private LocalDateTime udyamVerifiedAt;

    @Column(nullable = false)
    private LocalDateTime expiryTime;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (expiryTime == null) {
            expiryTime = LocalDateTime.now().plusMinutes(30);
        }
    }
}
