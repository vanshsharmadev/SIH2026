package com.example.Tender.bidder.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidderChatRequest {

    @NotBlank(message = "tenderId is required")
    private String tenderId;

    @NotBlank(message = "query is required")
    private String query;
}
