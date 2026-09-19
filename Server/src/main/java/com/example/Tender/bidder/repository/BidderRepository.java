package com.example.Tender.bidder.repository;

import com.example.Tender.bidder.entity.Bidder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BidderRepository extends JpaRepository<Bidder, Long> {
    Optional<Bidder> findByEmail(String email);
    Optional<Bidder> findByPanNumber(String panNumber);
    Optional<Bidder> findByGstNumber(String gstNumber);
    Optional<Bidder> findByUdyamNumber(String udyamNumber);

    boolean existsByEmail(String email);
    boolean existsByPanNumber(String panNumber);
    boolean existsByGstNumber(String gstNumber);
    boolean existsByUdyamNumber(String udyamNumber);
}
