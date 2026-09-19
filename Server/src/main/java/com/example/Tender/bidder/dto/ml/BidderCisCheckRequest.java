package com.example.Tender.bidder.dto.ml;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderCisCheckRequest {

    private Long tenderId;
    private List<Long> documentIds;
    private List<String> requiredDocuments;
    @Builder.Default
    private String tenderType = "general";
}
