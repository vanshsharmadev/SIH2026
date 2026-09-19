package com.example.Tender.bidder.repository;

import com.example.Tender.bidder.entity.BidderTempRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BidderTempRegistrationRepository extends JpaRepository<BidderTempRegistration, Long> {
    Optional<BidderTempRegistration> findByTempToken(String tempToken);
    Optional<BidderTempRegistration> findTopByEmailOrderByCreatedAtDesc(String email);
    void deleteByEmail(String email);
    boolean existsByEmail(String email);
}
