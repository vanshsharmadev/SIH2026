package com.example.Tender.bidder.repository;

import com.example.Tender.bidder.entity.BidderDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidderDocumentRepository extends JpaRepository<BidderDocument, Long> {

    List<BidderDocument> findByBidderIdOrderByCreatedAtDesc(Long bidderId);

    Optional<BidderDocument> findByIdAndBidderId(Long id, Long bidderId);

    List<BidderDocument> findByBidderIdAndDocumentType(Long bidderId, String documentType);

    List<BidderDocument> findByBidderIdAndIdIn(Long bidderId, List<Long> ids);

    void deleteByIdAndBidderId(Long id, Long bidderId);
}
