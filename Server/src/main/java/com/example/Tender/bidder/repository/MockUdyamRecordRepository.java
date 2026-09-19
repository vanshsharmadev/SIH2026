package com.example.Tender.bidder.repository;

import com.example.Tender.bidder.entity.MockUdyamRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MockUdyamRecordRepository extends JpaRepository<MockUdyamRecord, Long> {

    Optional<MockUdyamRecord> findByUdyamNumber(String udyamNumber);
}