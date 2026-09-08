package com.example.Tender.bidder.repository;

import com.example.Tender.bidder.entity.BidderVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BidderVerificationRepository extends JpaRepository<BidderVerification, Long> {

    @Query("SELECT bv FROM BidderVerification bv WHERE LOWER(TRIM(bv.name)) = LOWER(TRIM(:name)) AND LOWER(TRIM(bv.email)) = LOWER(TRIM(:email)) AND LOWER(TRIM(bv.gstNumber)) = LOWER(TRIM(:gstNumber))")
    Optional<BidderVerification> findByNameAndEmailAndGstNumberIgnoreCase(
            @Param("name") String name,
            @Param("email") String email,
            @Param("gstNumber") String gstNumber
    );

    @Query("SELECT bv FROM BidderVerification bv WHERE LOWER(TRIM(bv.email)) = LOWER(TRIM(:email)) AND LOWER(TRIM(bv.gstNumber)) = LOWER(TRIM(:gstNumber))")
    Optional<BidderVerification> findByEmailAndGstNumberIgnoreCase(
            @Param("email") String email,
            @Param("gstNumber") String gstNumber
    );

    @Query("SELECT bv FROM BidderVerification bv WHERE LOWER(TRIM(bv.gstNumber)) = LOWER(TRIM(:gstNumber))")
    Optional<BidderVerification> findByGstNumberIgnoreCase(@Param("gstNumber") String gstNumber);

    @Query("SELECT bv FROM BidderVerification bv WHERE LOWER(TRIM(bv.email)) = LOWER(TRIM(:email))")
    Optional<BidderVerification> findByEmailIgnoreCase(@Param("email") String email);
}
