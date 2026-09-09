package com.example.Tender.officer.service.rag;

import com.example.Tender.officer.dto.rag.TenderChatRequest;
import com.example.Tender.officer.dto.rag.TenderChatResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for Node AI RAG Service (pgvector Chunking, Embeddings & Gemini Chatbot)
 * Base URL: https://sih2026-86kl.onrender.com
 */
@Service
@Slf4j
public class NodeRagServiceClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;

    public NodeRagServiceClient(
            @Value("${ai.rag.service.base-url:https://sih2026-86kl.onrender.com}") String ragBaseUrl,
            ObjectMapper objectMapper) {
        this.baseUrl = ragBaseUrl;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000); // 15s connect timeout
        factory.setReadTimeout(120000);   // 120s read timeout (heavy Gemini/pgvector operations)

        this.restClient = RestClient.builder()
                .baseUrl(ragBaseUrl)
                .requestFactory(factory)
                .build();
        log.info("Initialized NodeRagServiceClient with Base URL: {}", ragBaseUrl);
    }

    /**
     * Check whether Node AI RAG service is running (GET /health)
     */
    public Map<String, Object> checkHealth() {
        try {
            return restClient.get()
                    .uri("/health")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("Failed to check Node AI RAG service health at {}: {}", baseUrl, e.getMessage());
            return Map.of(
                    "status", "DOWN",
                    "service", "node-ai-rag-service",
                    "error", e.getMessage()
            );
        }
    }

    /**
     * Process Tender PDF into text chunks & generate pgvector embeddings (POST /api/ai/tender/process)
     */
    public Map<String, Object> processTender(String tenderId, String title, String pdfUrl, String publicId) {
        try {
            log.info("Sending tenderId='{}' to Node AI RAG service (pdfUrl={}, publicId={})", tenderId, pdfUrl, publicId);
            Map<String, Object> payload = new HashMap<>();
            payload.put("tenderId", tenderId);
            if (title != null) payload.put("title", title);
            if (pdfUrl != null) payload.put("pdfUrl", pdfUrl);
            if (publicId != null) payload.put("publicId", publicId);

            return restClient.post()
                    .uri("/api/ai/tender/process")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("Node AI RAG processTender failed for tenderId='{}': {}", tenderId, e.getMessage());
            Map<String, Object> err = new HashMap<>();
            err.put("status", "ERROR");
            err.put("tenderId", tenderId);
            err.put("error", e.getMessage() != null ? e.getMessage() : "Unknown error");
            return err;
        }
    }

    public Map<String, Object> processTender(String tenderId) {
        return processTender(tenderId, null, null, null);
    }

    /**
     * Process Bidder PDF into text chunks & generate pgvector embeddings (POST /api/ai/bidder/process)
     */
    public Map<String, Object> processBidderDocument(String tenderId, String bidderId, String documentId, String documentType, String pdfUrl, String publicId) {
        try {
            log.info("Sending bidder doc to Node AI RAG: tenderId='{}', bidderId='{}', docId='{}', type='{}', pdfUrl={}",
                    tenderId, bidderId, documentId, documentType, pdfUrl);

            Map<String, Object> payload = new HashMap<>();
            payload.put("tenderId", tenderId);
            payload.put("bidderId", bidderId);
            payload.put("documentId", documentId);
            payload.put("documentType", documentType != null ? documentType : "OTHER");
            if (pdfUrl != null) payload.put("pdfUrl", pdfUrl);
            if (publicId != null) payload.put("publicId", publicId);

            return restClient.post()
                    .uri("/api/ai/bidder/process")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("Node AI RAG processBidderDocument failed: {}", e.getMessage());
            Map<String, Object> err = new HashMap<>();
            err.put("status", "ERROR");
            err.put("tenderId", tenderId);
            err.put("bidderId", bidderId);
            err.put("error", e.getMessage() != null ? e.getMessage() : "Unknown error");
            return err;
        }
    }

    public Map<String, Object> processBidderDocument(String tenderId, String bidderId, String documentId, String documentType) {
        return processBidderDocument(tenderId, bidderId, documentId, documentType, null, null);
    }

    /**
     * Ask Bidder-Tender Chatbot (POST /api/ai/bidder-tender-chat/ask)
     * Retrieves tender + bidder + ML summary context and generates Gemini response.
     */
    public TenderChatResponse askChatbot(TenderChatRequest request) {
        try {
            log.info("Querying Node AI RAG Chatbot: tenderId='{}', bidderId='{}', query='{}'",
                    request.getTenderId(), request.getBidderId(), request.getQuery());

            Map<String, Object> payload = new HashMap<>();
            if (request.getTenderId() != null) payload.put("tenderId", request.getTenderId());
            if (request.getBidderId() != null) payload.put("bidderId", request.getBidderId());
            payload.put("query", request.getQuery());

            Map<String, Object> rawResponse = restClient.post()
                    .uri("/api/ai/bidder-tender-chat/ask")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            String answer = null;
            Object sources = null;

            if (rawResponse != null) {
                if (rawResponse.get("data") instanceof Map<?, ?> dataMap) {
                    answer = (String) dataMap.get("answer");
                    sources = dataMap.get("sources");
                } else {
                    answer = (String) rawResponse.get("answer");
                    sources = rawResponse.get("sources");
                }
            }

            return TenderChatResponse.builder()
                    .answer(answer != null ? answer : "No answer generated by AI service.")
                    .sources(sources)
                    .tenderId(request.getTenderId())
                    .bidderId(request.getBidderId())
                    .query(request.getQuery())
                    .build();
        } catch (Exception e) {
            log.error("Node AI RAG askChatbot failed: {}", e.getMessage());
            return TenderChatResponse.builder()
                    .answer("Unable to generate AI response due to a downstream RAG service error: " + e.getMessage())
                    .tenderId(request.getTenderId())
                    .bidderId(request.getBidderId())
                    .query(request.getQuery())
                    .build();
        }
    }
}
