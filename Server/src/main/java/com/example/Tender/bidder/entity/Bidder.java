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

    @Column(unique = true)
    private String panNumber;

    @Column(unique = true)
    private String gstNumber;

    @Column(unique = true)
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