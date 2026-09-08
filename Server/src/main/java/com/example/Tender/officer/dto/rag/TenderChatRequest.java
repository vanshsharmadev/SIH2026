package com.example.Tender.officer.dto.rag;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenderChatRequest {

    private String tenderId;

    private String bidderId;

    @NotBlank(message = "Query cannot be blank")
    private String query;
}
