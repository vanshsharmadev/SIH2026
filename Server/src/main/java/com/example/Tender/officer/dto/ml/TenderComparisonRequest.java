package com.example.Tender.officer.dto.ml;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenderComparisonRequest {

    @NotEmpty(message = "Bidders data cannot be empty")
    @JsonProperty("bidders_data")
    private List<Map<String, Object>> biddersData;

    @JsonProperty("tender_requirements")
    private Map<String, Object> tenderRequirements;
}
