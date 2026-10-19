package com.example.Tender.bidder.repository;

import com.example.Tender.bidder.entity.BidSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidSubmissionRepository extends JpaRepository<BidSubmission, Long> {

    List<BidSubmission> findByBidderIdOrderByCreatedAtDesc(Long bidderId);

    List<BidSubmission> findByTenderIdOrderByCreatedAtDesc(String tenderId);

    List<BidSubmission> findAllByOrderByCreatedAtDesc();

    Optional<BidSubmission> findByBidderIdAndTenderId(Long bidderId, String tenderId);

    boolean existsByBidderIdAndTenderId(Long bidderId, String tenderId);
}
