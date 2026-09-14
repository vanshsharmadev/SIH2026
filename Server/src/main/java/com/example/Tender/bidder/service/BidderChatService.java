package com.example.Tender.bidder.service;

import com.example.Tender.bidder.dto.chat.BidderChatData;
import com.example.Tender.bidder.dto.chat.BidderChatRequest;
import com.example.Tender.bidder.dto.chat.BidderChatResponse;
import com.example.Tender.bidder.exception.BidderChatException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.SocketTimeoutException;
import java.util.HashMap;
import java.util.Map;

/**
 * Service responsible for communicating with the internal Node AI RAG microservice
 * to answer bidder tender queries.
 */
@Service
@Slf4j
public class BidderChatService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;

    @org.springframework.beans.factory.annotation.Autowired
    public BidderChatService(
            @Value("${ai.rag.service.base-url:${AI_RAG_BASE_URL:${AI_RAG_SERVICE_URL:https://sih2026-86kl.onrender.com}}}") String ragBaseUrl,
            @Value("${ai.rag.connect-timeout-ms:15000}") int connectTimeout,
            @Value("${ai.rag.read-timeout-ms:120000}") int readTimeout,
            ObjectMapper objectMapper) {
        this.baseUrl = ragBaseUrl;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);

        this.restClient = RestClient.builder()
                .baseUrl(ragBaseUrl)
                .requestFactory(factory)
                .build();
        log.info("Initialized BidderChatService with Base URL: {}", ragBaseUrl);
    }

    // Constructor for testing or custom RestClient configuration
    public BidderChatService(RestClient restClient, ObjectMapper objectMapper, String baseUrl) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
    }

    /**
     * Forwards bidder tender query to AI/RAG microservice at POST /api/ai/bidder-chat/ask
     *
     * @param request BidderChatRequest containing tenderId and query
     * @return BidderChatResponse containing answer and document sources
     */
    public BidderChatResponse askBidderChat(BidderChatRequest request) {
        if (request == null) {
            throw new BidderChatException(HttpStatus.BAD_REQUEST, "Bad Request", "Request body cannot be null");
        }

        if (!StringUtils.hasText(request.getTenderId())) {
            throw new BidderChatException(HttpStatus.BAD_REQUEST, "Bad Request", "tenderId is required");
        }

        if (!StringUtils.hasText(request.getQuery())) {
            throw new BidderChatException(HttpStatus.BAD_REQUEST, "Bad Request", "query is required");
        }

        String tenderId = request.getTenderId().trim();
        log.info("Forwarding bidder chat request to AI/RAG service for tenderId: {}", tenderId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("tenderId", tenderId);
        payload.put("query", request.getQuery().trim());

        try {
            Map<String, Object> rawResponse = restClient.post()
                    .uri("/api/ai/bidder-chat/ask")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (rawResponse == null || rawResponse.isEmpty()) {
                log.error("AI/RAG service returned empty response for tenderId: {}", tenderId);
                throw new BidderChatException(HttpStatus.BAD_GATEWAY, "Bad Gateway", "Empty response received from AI/RAG service");
            }

            return parseAiResponse(rawResponse, tenderId);

        } catch (RestClientResponseException ex) {
            log.error("AI/RAG service returned HTTP {} for tenderId: {}", ex.getStatusCode(), tenderId);
            handleDownstreamHttpError(ex, tenderId);
            throw new BidderChatException(HttpStatus.valueOf(ex.getStatusCode().value()), "AI Service Error", "Failed to answer bidder query");
        } catch (ResourceAccessException ex) {
            log.error("Resource access error while contacting AI/RAG service for tenderId {}: {}", tenderId, ex.getMessage());
            if (ex.getCause() instanceof SocketTimeoutException
                    || (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("timeout"))) {
                throw new BidderChatException(HttpStatus.GATEWAY_TIMEOUT, "Gateway Timeout", "AI/RAG service request timed out. Please try again later.", ex);
            }
            throw new BidderChatException(HttpStatus.SERVICE_UNAVAILABLE, "Service Unavailable", "Unable to connect to AI/RAG service: " + ex.getMessage(), ex);
        } catch (BidderChatException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error during bidder chat for tenderId {}: {}", tenderId, ex.getMessage());
            throw new BidderChatException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Error", "Unexpected error communicating with AI/RAG service: " + ex.getMessage(), ex);
        }
    }

    @SuppressWarnings("unchecked")
    private BidderChatResponse parseAiResponse(Map<String, Object> rawResponse, String tenderId) {
        String message = (String) rawResponse.get("message");

        // If downstream explicitly returned success: false
        if (Boolean.FALSE.equals(rawResponse.get("success"))) {
            String errorMsg = message != null ? message : "Failed to answer bidder query";
            String errorDetails = rawResponse.get("error") != null ? String.valueOf(rawResponse.get("error")) : null;
            throw new BidderChatException(HttpStatus.BAD_GATEWAY, "AI Service Failure", errorMsg, errorDetails);
        }

        String answer = null;
        Object sources = null;

        Object dataObj = rawResponse.get("data");
        if (dataObj instanceof Map<?, ?> dataMap) {
            answer = (String) dataMap.get("answer");
            sources = dataMap.get("sources");
        } else {
            // Fallback if answer and sources are returned at top level
            if (rawResponse.get("answer") != null) {
                answer = (String) rawResponse.get("answer");
                sources = rawResponse.get("sources");
            }
        }

        if (!StringUtils.hasText(answer)) {
            log.warn("AI/RAG service succeeded but returned empty answer text for tenderId: {}", tenderId);
            answer = "No answer could be retrieved for the specified query.";
        }

        log.info("Successfully received AI response for tenderId: {}", tenderId);

        return BidderChatResponse.builder()
                .success(true)
                .message(message)
                .data(BidderChatData.builder()
                        .answer(answer)
                        .sources(sources)
                        .build())
                .build();
    }

    private void handleDownstreamHttpError(RestClientResponseException ex, String tenderId) {
        String responseBody = ex.getResponseBodyAsString();
        String message = "Failed to answer bidder query";
        String errorDetail = null;

        if (StringUtils.hasText(responseBody)) {
            try {
                Map<String, Object> errMap = objectMapper.readValue(responseBody, new TypeReference<>() {});
                if (errMap.get("message") != null) {
                    message = String.valueOf(errMap.get("message"));
                }
                if (errMap.get("error") != null) {
                    errorDetail = String.valueOf(errMap.get("error"));
                }
            } catch (Exception ignored) {
                message = responseBody;
            }
        }

        int statusCode = ex.getStatusCode().value();
        HttpStatus status = HttpStatus.resolve(statusCode);
        if (status == null) {
            status = HttpStatus.BAD_GATEWAY;
        }

        if (status.is4xxClientError()) {
            throw new BidderChatException(HttpStatus.BAD_REQUEST, "Bad Request", message, errorDetail);
        }

        throw new BidderChatException(HttpStatus.BAD_GATEWAY, "AI Service Error", message, errorDetail);
    }
}
