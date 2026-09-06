package com.example.Tender.bidder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mock_gst_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MockGstRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gst_number", nullable = false, unique = true)
    private String gstNumber;

    @Column(name = "legal_name", nullable = false)
    private String legalName;

    @Column(name = "pan_number", nullable = false)
    private String panNumber;

    @Column(name = "state_code", nullable = false)
    private String stateCode;

    @Column(nullable = false)
    private String status;
}