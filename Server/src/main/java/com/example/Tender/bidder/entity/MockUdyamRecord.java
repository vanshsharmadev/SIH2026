package com.example.Tender.bidder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mock_udyam_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MockUdyamRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "udyam_number", nullable = false, unique = true)
    private String udyamNumber;

    @Column(name = "enterprise_name", nullable = false)
    private String enterpriseName;

    @Column(name = "enterprise_type", nullable = false)
    private String enterpriseType;

    @Column(name = "major_activity", nullable = false)
    private String majorActivity;

    @Column(nullable = false)
    private String status;
}