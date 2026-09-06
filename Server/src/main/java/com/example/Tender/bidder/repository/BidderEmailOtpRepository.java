package com.example.Tender.bidder.repository;

import com.example.Tender.bidder.entity.BidderEmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BidderEmailOtpRepository extends JpaRepository<BidderEmailOtp, Long> {
    Optional<BidderEmailOtp> findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(String email);
    Optional<BidderEmailOtp> findByResetToken(String resetToken);
    void deleteByEmail(String email);
}
