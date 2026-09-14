package com.example.Tender.bidder.service;

import com.example.Tender.bidder.dto.chat.BidderChatRequest;
import com.example.Tender.bidder.dto.chat.BidderChatResponse;
import com.example.Tender.bidder.exception.BidderChatException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class BidderChatServiceTest {

    private MockRestServiceServer mockServer;
    private BidderChatService bidderChatService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String BASE_URL = "https://sih2026-86kl.onrender.com";

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();
        bidderChatService = new BidderChatService(restClient, objectMapper, BASE_URL);
    }

    @Test
    @DisplayName("1. askBidderChat succeeds and deserializes answer and sources")
    void testAskBidderChat_Success() {
        String aiResponseJson = """
            {
              "success": true,
              "data": {
                "answer": "The minimum turnover required is ₹10 crore.",
                "sources": {
                  "tender": [
                    {
                      "content": "Clause 4.2: Minimum turnover requirement"
                    }
                  ]
                }
              }
            }
            """;

        mockServer.expect(requestTo(BASE_URL + "/api/ai/bidder-chat/ask"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.tenderId").value("TENDER_123"))
                .andExpect(jsonPath("$.query").value("What is the minimum turnover required?"))
                .andRespond(withSuccess(aiResponseJson, MediaType.APPLICATION_JSON));

        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("TENDER_123")
                .query("What is the minimum turnover required?")
                .build();

        BidderChatResponse response = bidderChatService.askBidderChat(request);

        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertNotNull(response.getData());
        assertEquals("The minimum turnover required is ₹10 crore.", response.getData().getAnswer());
        assertNotNull(response.getData().getSources());
        mockServer.verify();
    }

    @Test
    @DisplayName("2. askBidderChat throws exception on missing tenderId")
    void testAskBidderChat_MissingTenderId() {
        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("")
                .query("What is turnover?")
                .build();

        BidderChatException ex = assertThrows(BidderChatException.class,
                () -> bidderChatService.askBidderChat(request));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("tenderId is required"));
    }

    @Test
    @DisplayName("3. askBidderChat throws exception on missing query")
    void testAskBidderChat_MissingQuery() {
        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("TENDER_123")
                .query("   ")
                .build();

        BidderChatException ex = assertThrows(BidderChatException.class,
                () -> bidderChatService.askBidderChat(request));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("query is required"));
    }

    @Test
    @DisplayName("4. askBidderChat throws exception on null request")
    void testAskBidderChat_NullRequest() {
        BidderChatException ex = assertThrows(BidderChatException.class,
                () -> bidderChatService.askBidderChat(null));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Request body cannot be null"));
    }

    @Test
    @DisplayName("5. askBidderChat handles downstream 400 Bad Request from AI/RAG service")
    void testAskBidderChat_Downstream400() {
        String errJson = """
            {
              "success": false,
              "message": "tenderId is required"
            }
            """;

        mockServer.expect(requestTo(BASE_URL + "/api/ai/bidder-chat/ask"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withBadRequest().body(errJson).contentType(MediaType.APPLICATION_JSON));

        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("TND-999")
                .query("What is the EMD?")
                .build();

        BidderChatException ex = assertThrows(BidderChatException.class,
                () -> bidderChatService.askBidderChat(request));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("tenderId is required", ex.getMessage());
        mockServer.verify();
    }

    @Test
    @DisplayName("6. askBidderChat handles downstream 500 Server Error from AI/RAG service")
    void testAskBidderChat_Downstream500() {
        String errJson = """
            {
              "success": false,
              "message": "Failed to answer bidder query",
              "error": "pgvector connection failed"
            }
            """;

        mockServer.expect(requestTo(BASE_URL + "/api/ai/bidder-chat/ask"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError().body(errJson).contentType(MediaType.APPLICATION_JSON));

        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("TND-999")
                .query("What is the EMD?")
                .build();

        BidderChatException ex = assertThrows(BidderChatException.class,
                () -> bidderChatService.askBidderChat(request));
        assertEquals(HttpStatus.BAD_GATEWAY, ex.getStatus());
        assertTrue(ex.getMessage().contains("Failed to answer bidder query"));
        assertEquals("pgvector connection failed", ex.getDetails());
        mockServer.verify();
    }

    @Test
    @DisplayName("7. askBidderChat handles fallback root-level answer and sources")
    void testAskBidderChat_RootLevelAnswerFallback() {
        String fallbackJson = """
            {
              "success": true,
              "answer": "EMD amount is ₹50,000.",
              "sources": ["Page 2 Clause 1.1"]
            }
            """;

        mockServer.expect(requestTo(BASE_URL + "/api/ai/bidder-chat/ask"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(fallbackJson, MediaType.APPLICATION_JSON));

        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("TND-001")
                .query("What is EMD?")
                .build();

        BidderChatResponse response = bidderChatService.askBidderChat(request);

        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertEquals("EMD amount is ₹50,000.", response.getData().getAnswer());
        assertNotNull(response.getData().getSources());
        mockServer.verify();
    }

    @Test
    @DisplayName("8. askBidderChat handles empty response payload")
    void testAskBidderChat_EmptyPayload() {
        mockServer.expect(requestTo(BASE_URL + "/api/ai/bidder-chat/ask"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("TND-001")
                .query("What is EMD?")
                .build();

        BidderChatException ex = assertThrows(BidderChatException.class,
                () -> bidderChatService.askBidderChat(request));
        assertEquals(HttpStatus.BAD_GATEWAY, ex.getStatus());
        mockServer.verify();
    }
}
