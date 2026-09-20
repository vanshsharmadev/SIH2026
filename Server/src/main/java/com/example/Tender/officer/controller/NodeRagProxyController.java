package com.example.Tender.officer.controller;

import com.example.Tender.officer.dto.OfficerApiResponse;
import com.example.Tender.officer.dto.rag.TenderChatRequest;
import com.example.Tender.officer.dto.rag.TenderChatResponse;
import com.example.Tender.officer.service.rag.NodeRagServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class NodeRagProxyController {

    private final NodeRagServiceClient nodeRagServiceClient;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        return ResponseEntity.ok(nodeRagServiceClient.checkHealth());
    }

    @PostMapping("/tender/process")
    public ResponseEntity<Map<String, Object>> processTender(@RequestBody Map<String, Object> req) {
        String tenderId = String.valueOf(req.get("tenderId"));
        String title = req.get("title") != null ? String.valueOf(req.get("title")) : null;
        String pdfUrl = req.get("pdfUrl") != null ? String.valueOf(req.get("pdfUrl")) : null;
        String publicId = req.get("publicId") != null ? String.valueOf(req.get("publicId")) : null;

        Map<String, Object> result = nodeRagServiceClient.processTender(tenderId, title, pdfUrl, publicId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/bidder/process")
    public ResponseEntity<Map<String, Object>> processBidder(@RequestBody Map<String, Object> req) {
        String tenderId = String.valueOf(req.get("tenderId"));
        String bidderId = String.valueOf(req.get("bidderId"));
        String documentId = req.get("documentId") != null ? String.valueOf(req.get("documentId")) : null;
        String documentType = req.get("documentType") != null ? String.valueOf(req.get("documentType")) : null;
        String pdfUrl = req.get("pdfUrl") != null ? String.valueOf(req.get("pdfUrl")) : null;
        String publicId = req.get("publicId") != null ? String.valueOf(req.get("publicId")) : null;

        Map<String, Object> result = nodeRagServiceClient.processBidderDocument(tenderId, bidderId, documentId, documentType, pdfUrl, publicId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/bidder-tender-chat/ask")
    public ResponseEntity<TenderChatResponse> askChatbot(@RequestBody TenderChatRequest req) {
        TenderChatResponse result = nodeRagServiceClient.askChatbot(req);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/bidder-chat/ask")
    public ResponseEntity<Map<String, Object>> askBidderChat(@RequestBody Map<String, Object> req) {
        Map<String, Object> result = nodeRagServiceClient.askBidderChat(req);
        return ResponseEntity.ok(result);
    }
}
