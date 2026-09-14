package com.example.Tender.bidder.controller;

import com.example.Tender.bidder.dto.chat.BidderChatData;
import com.example.Tender.bidder.dto.chat.BidderChatRequest;
import com.example.Tender.bidder.dto.chat.BidderChatResponse;
import com.example.Tender.bidder.exception.BidderChatException;
import com.example.Tender.bidder.exception.GlobalExceptionHandler;
import com.example.Tender.bidder.security.BidderPrincipal;
import com.example.Tender.bidder.service.BidderChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class BidderChatControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BidderChatService bidderChatService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        BidderChatController controller = new BidderChatController(bidderChatService);

        HandlerMethodArgumentResolver principalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter,
                                          ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest,
                                          WebDataBinderFactory binderFactory) {
                return null;
            }
        };

        this.mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(principalResolver)
                .build();
    }

    @Test
    @DisplayName("POST /api/bidder/chat - 200 OK on valid request")
    void testAskChatbot_Success() throws Exception {
        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("TENDER_123")
                .query("What is the minimum turnover required?")
                .build();

        BidderChatResponse mockResponse = BidderChatResponse.builder()
                .success(true)
                .data(BidderChatData.builder()
                        .answer("The minimum turnover required is ₹10 crore.")
                        .sources(Map.of("tender", List.of(Map.of("content", "Clause 4.2"))))
                        .build())
                .build();

        when(bidderChatService.askBidderChat(any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/bidder/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.answer", is("The minimum turnover required is ₹10 crore.")))
                .andExpect(jsonPath("$.data.sources.tender", hasSize(1)));
    }

    @Test
    @DisplayName("POST /api/bidder/chat/ask - 200 OK on alias endpoint")
    void testAskChatbotAlias_Success() throws Exception {
        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("TENDER_123")
                .query("What is the warranty period?")
                .build();

        BidderChatResponse mockResponse = BidderChatResponse.builder()
                .success(true)
                .data(BidderChatData.builder()
                        .answer("Warranty is 3 years on-site.")
                        .build())
                .build();

        when(bidderChatService.askBidderChat(any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/bidder/chat/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.answer", is("Warranty is 3 years on-site.")));
    }

    @Test
    @DisplayName("POST /api/bidder/chat - 400 Bad Request when tenderId is blank")
    void testAskChatbot_ValidationFailure_BlankTenderId() throws Exception {
        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("")
                .query("What is turnover?")
                .build();

        mockMvc.perform(post("/api/bidder/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Validation Failed")))
                .andExpect(jsonPath("$.validationErrors.tenderId").exists());
    }

    @Test
    @DisplayName("POST /api/bidder/chat - 400 Bad Request when query is blank")
    void testAskChatbot_ValidationFailure_BlankQuery() throws Exception {
        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("TENDER_123")
                .query("   ")
                .build();

        mockMvc.perform(post("/api/bidder/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Validation Failed")))
                .andExpect(jsonPath("$.validationErrors.query").exists());
    }

    @Test
    @DisplayName("POST /api/bidder/chat - 502 Bad Gateway when downstream service error occurs")
    void testAskChatbot_DownstreamError_MappedByGlobalExceptionHandler() throws Exception {
        BidderChatRequest request = BidderChatRequest.builder()
                .tenderId("TENDER_123")
                .query("What is turnover?")
                .build();

        when(bidderChatService.askBidderChat(any()))
                .thenThrow(new BidderChatException(HttpStatus.BAD_GATEWAY, "AI Service Error", "Failed to answer bidder query"));

        mockMvc.perform(post("/api/bidder/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status", is(502)))
                .andExpect(jsonPath("$.error", is("AI Service Error")))
                .andExpect(jsonPath("$.message", is("Failed to answer bidder query")));
    }
}
