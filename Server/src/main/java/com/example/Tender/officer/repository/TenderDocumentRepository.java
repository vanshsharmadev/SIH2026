package com.example.Tender.officer.repository;

import com.example.Tender.officer.model.TenderDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenderDocumentRepository extends JpaRepository<TenderDocument, Long> {

    List<TenderDocument> findByUploadedByOfficerIdOrderByCreatedAtDesc(Long uploadedByOfficerId);

    Optional<TenderDocument> findByIdAndUploadedByOfficerId(Long id, Long uploadedByOfficerId);

    List<TenderDocument> findAllByOrderByCreatedAtDesc();
}
