package com.example.Tender.officer.dto.rag;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TenderChatResponse {

    private String answer;

    private Object sources;

    private String tenderId;

    private String bidderId;

    private String query;

    private Map<String, Object> metadata;
}
