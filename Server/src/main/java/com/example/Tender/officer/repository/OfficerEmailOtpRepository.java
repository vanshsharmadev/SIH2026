package com.example.Tender.officer.repository;

import com.example.Tender.officer.model.OfficerEmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OfficerEmailOtpRepository extends JpaRepository<OfficerEmailOtp, Long> {

    Optional<OfficerEmailOtp> findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(String email);

    void deleteByEmail(String email);
}
