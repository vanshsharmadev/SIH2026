package com.example.Tender.officer.dto.ml;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TenderComparisonResponse {

    private Long tenderId;
    private String tenderTitle;
    private String status;
    private Map<String, Object> comparisonResult;
}
