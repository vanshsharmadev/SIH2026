package com.example.Tender.bidder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mock_pan_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MockPanRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pan_number", nullable = false, unique = true)
    private String panNumber;

    @Column(name = "registered_name", nullable = false)
    private String registeredName;

    @Column(name = "pan_category", nullable = false)
    private String panCategory;
}