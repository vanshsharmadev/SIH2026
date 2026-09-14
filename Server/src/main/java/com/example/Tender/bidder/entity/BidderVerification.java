package com.example.Tender.bidder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bidder_verification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "gst_number", nullable = false, length = 15)
    private String gstNumber;
}
