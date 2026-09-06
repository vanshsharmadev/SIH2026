package com.example.Tender.bidder.repository;

import com.example.Tender.bidder.entity.MockPanRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MockPanRecordRepository extends JpaRepository<MockPanRecord, Long> {

    Optional<MockPanRecord> findByPanNumber(String panNumber);
}