package com.example.Tender.bidder.dto.chat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BidderChatResponse {

    private Boolean success;

    private String message;

    private BidderChatData data;

    private String error;

    public static BidderChatResponse success(String answer, Object sources) {
        return BidderChatResponse.builder()
                .success(true)
                .data(BidderChatData.builder()
                        .answer(answer)
                        .sources(sources)
                        .build())
                .build();
    }

    public static BidderChatResponse failure(String message, String error) {
        return BidderChatResponse.builder()
                .success(false)
                .message(message)
                .error(error)
                .build();
    }
}
