package com.example.Tender.bidder.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "bidders")
@Getter
@Setter
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

    @Column(nullable = false)
    private String password;

    private String phone;

    private String address;

    @Column(columnDefinition = "TEXT")
    private String profileMetadata;

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