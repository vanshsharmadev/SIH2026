package com.example.Tender.bidder.repository;

import com.example.Tender.bidder.entity.Bidder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BidderRepository extends JpaRepository<Bidder,Long> {
    Optional<Bidder> findByEmail(String email);
}
