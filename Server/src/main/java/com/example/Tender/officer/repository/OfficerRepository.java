package com.example.Tender.officer.repository;

import com.example.Tender.officer.model.Officer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OfficerRepository extends JpaRepository<Officer, Long> {

    Optional<Officer> findByEmail(String email);

    Optional<Officer> findByMobile(String mobile);

    Optional<Officer> findByEmailOrMobile(String email, String mobile);

    Boolean existsByEmail(String email);

    Boolean existsByMobile(String mobile);
}
