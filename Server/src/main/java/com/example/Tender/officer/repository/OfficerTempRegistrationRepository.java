package com.example.Tender.officer.repository;

import com.example.Tender.officer.model.OfficerTempRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OfficerTempRegistrationRepository extends JpaRepository<OfficerTempRegistration, Long> {

    Optional<OfficerTempRegistration> findTopByEmailOrderByCreatedAtDesc(String email);

    Optional<OfficerTempRegistration> findByEmail(String email);

    Optional<OfficerTempRegistration> findByTempToken(String tempToken);

    Boolean existsByEmail(String email);

    Boolean existsByMobile(String mobile);

    void deleteByEmail(String email);

    void deleteByTempToken(String tempToken);
}
