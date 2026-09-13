package com.example.Tender.bidder.controller;

import com.example.Tender.bidder.dto.chat.BidderChatRequest;
import com.example.Tender.bidder.dto.chat.BidderChatResponse;
import com.example.Tender.bidder.security.BidderPrincipal;
import com.example.Tender.bidder.service.BidderChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/bidder/chat")
@RequiredArgsConstructor
@CrossOrigin(
        originPatterns = {"https://gem-compliflix.vercel.app", "https://*.vercel.app", "http://localhost:[*]", "http://127.0.0.1:[*]", "*"},
        allowedHeaders = "*",
        allowCredentials = "true",
        maxAge = 3600
)
public class BidderChatController {

    private final BidderChatService bidderChatService;

    /**
     * Bidder Tender Chat API:
     * Asks questions regarding a specific tender's requirements, eligibility, terms, or specifications.
     * Intermediates with the Node AI RAG service (pgvector + Gemini 1.5).
     *
     * @param request BidderChatRequest containing tenderId and query
     * @param principal Authenticated BidderPrincipal
     * @return BidderChatResponse containing answer and document sources
     */
    @PostMapping
    public ResponseEntity<BidderChatResponse> askChatbot(
            @Valid @RequestBody BidderChatRequest request,
            @AuthenticationPrincipal BidderPrincipal principal) {

        Long bidderId = principal != null ? principal.getId() : null;
        log.info("Bidder chat inquiry initiated for tenderId: {} by bidderId: {}", request.getTenderId(), bidderId);

        BidderChatResponse response = bidderChatService.askBidderChat(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Alias endpoint for backward/client compatibility: POST /api/bidder/chat/ask
     */
    @PostMapping("/ask")
    public ResponseEntity<BidderChatResponse> askChatbotAlias(
            @Valid @RequestBody BidderChatRequest request,
            @AuthenticationPrincipal BidderPrincipal principal) {
        return askChatbot(request, principal);
    }
}
