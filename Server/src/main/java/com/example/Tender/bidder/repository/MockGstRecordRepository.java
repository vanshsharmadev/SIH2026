package com.example.Tender.bidder.repository;

import com.example.Tender.bidder.entity.MockGstRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MockGstRecordRepository extends JpaRepository<MockGstRecord, Long> {

    Optional<MockGstRecord> findByGstNumber(String gstNumber);
}