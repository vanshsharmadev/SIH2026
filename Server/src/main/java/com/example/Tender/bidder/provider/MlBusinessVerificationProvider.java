package com.example.Tender.bidder.provider;

import com.example.Tender.bidder.dto.ml.BidderTaxpayerVerifyResponse;
import com.example.Tender.officer.service.ml.MlServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class MlBusinessVerificationProvider {

    private final MlServiceClient mlServiceClient;
    private final MockBusinessVerificationProvider mockProvider;

    /**
     * Verifies taxpayer credentials (GSTIN or PAN) using the ML Microservice.
     * Gracefully falls back to MockBusinessVerificationProvider if ML service is unreachable.
     */
    public BidderTaxpayerVerifyResponse verifyTaxpayer(
            String identifier,
            String identifierType,
            String expectedLegalName,
            String stateCode,
            Boolean useLivePortal) {

        String normalizedId = identifier != null ? identifier.trim().toUpperCase() : "";
        String type = (identifierType != null && identifierType.equalsIgnoreCase("pan")) ? "pan" : "gstin";

        log.info("Verifying taxpayer credentials via ML Engine: id={}, type={}, expectedName={}",
                normalizedId, type, expectedLegalName);

        try {
            // Attempt live ML microservice call
            Map<String, Object> mlResult = mlServiceClient.verifyTaxpayer(normalizedId, type, stateCode, useLivePortal);

            if (mlResult != null && (Boolean.TRUE.equals(mlResult.get("success")) || Boolean.TRUE.equals(mlResult.get("valid")))) {
                log.info("ML Microservice verification succeeded for {}", normalizedId);
                return mapMlResultToResponse(mlResult, normalizedId, type, expectedLegalName);
            }
        } catch (Exception ex) {
            log.warn("ML Service verification unavailable ({}), falling back to local verification repository...", ex.getMessage());
        }

        // Fallback to MockBusinessVerificationProvider
        return fallbackVerify(normalizedId, type, expectedLegalName);
    }

    /**
     * Scans and verifies a physical or PDF taxpayer document (PAN card, GST cert) using ML OCR & Live Portal.
     */
    public Map<String, Object> scanAndVerifyTaxpayerDoc(MultipartFile file, boolean useLivePortal) {
        log.info("Scanning taxpayer document via ML Engine: filename={}, useLivePortal={}",
                file.getOriginalFilename(), useLivePortal);
        try {
            return mlServiceClient.scanAndVerifyTaxpayer(file, null, true, useLivePortal);
        } catch (Exception ex) {
            log.error("ML Document scan failed: {}", ex.getMessage());
            throw new RuntimeException("ML Taxpayer Document Scan failed: " + ex.getMessage(), ex);
        }
    }

    @SuppressWarnings("unchecked")
    private BidderTaxpayerVerifyResponse mapMlResultToResponse(
            Map<String, Object> mlResult,
            String identifier,
            String identifierType,
            String expectedLegalName) {

        Map<String, Object> verificationData = (Map<String, Object>) mlResult.get("verification");
        if (verificationData == null) {
            verificationData = mlResult;
        }

        String legalName = extractString(verificationData, "legal_name", "registered_name", "taxpayer_name");
        String tradeName = extractString(verificationData, "trade_name");
        String status = extractString(verificationData, "status", "current_status");
        if (status == null || status.isBlank()) {
            status = Boolean.TRUE.equals(verificationData.get("valid")) ? "Active" : "Invalid";
        }

        String state = extractString(verificationData, "state", "state_name");
        Double complianceScore = extractDouble(verificationData, "compliance_score", "score");
        String riskLevel = extractString(verificationData, "risk_level");
        Double filingRate = extractDouble(verificationData, "filing_rate_percent");
        String gstr3b = extractString(verificationData, "gstr3b_filing_status");

        boolean nameMatched = true;
        if (StringUtils.hasText(expectedLegalName) && StringUtils.hasText(legalName)) {
            nameMatched = isNameMatch(expectedLegalName, legalName);
        }

        List<Map<String, Object>> errors = Collections.emptyList();
        if (verificationData.get("errors_detected") instanceof List) {
            errors = (List<Map<String, Object>>) verificationData.get("errors_detected");
        }

        return BidderTaxpayerVerifyResponse.builder()
                .valid(true)
                .identifier(identifier)
                .identifierType(identifierType)
                .legalName(legalName)
                .tradeName(tradeName)
                .nameMatched(nameMatched)
                .status(status)
                .state(state)
                .complianceScore(complianceScore != null ? complianceScore : 95.0)
                .riskLevel(riskLevel != null ? riskLevel : "LOW")
                .filingRatePercent(filingRate != null ? filingRate : 90.0)
                .gstr3bFilingStatus(gstr3b != null ? gstr3b : "Regular")
                .errorsDetected(errors)
                .message("Verified successfully via ML Taxpayer Intelligence Engine.")
                .isMlVerified(true)
                .verificationSource("ML_MICROSERVICE_LIVE")
                .build();
    }

    private BidderTaxpayerVerifyResponse fallbackVerify(String identifier, String type, String expectedLegalName) {
        log.info("Executing local fallback verification for {} ({})", identifier, type);

        if ("pan".equalsIgnoreCase(type)) {
            MockBusinessVerificationProvider.PanVerificationResult panRes =
                    mockProvider.verifyPan(identifier, expectedLegalName, null, false);

            boolean isValid = "VALID".equalsIgnoreCase(panRes.getStatus());
            return BidderTaxpayerVerifyResponse.builder()
                    .valid(isValid)
                    .identifier(identifier)
                    .identifierType("pan")
                    .legalName(panRes.getRegisteredName())
                    .nameMatched(panRes.isNameMatched())
                    .status(panRes.getStatus())
                    .complianceScore(isValid ? 90.0 : 40.0)
                    .riskLevel(isValid ? "LOW" : "HIGH")
                    .message(panRes.getMessage())
                    .isMlVerified(false)
                    .verificationSource("FALLBACK_DATABASE")
                    .build();
        } else {
            String derivedPan = (identifier.length() >= 12) ? identifier.substring(2, 12) : "";
            MockBusinessVerificationProvider.GstVerificationResult gstRes =
                    mockProvider.verifyGst(identifier, derivedPan, expectedLegalName, null, false);

            boolean isValid = "ACTIVE".equalsIgnoreCase(gstRes.getStatus());
            return BidderTaxpayerVerifyResponse.builder()
                    .valid(isValid)
                    .identifier(identifier)
                    .identifierType("gstin")
                    .legalName(gstRes.getLegalName())
                    .tradeName(gstRes.getTradeName())
                    .state(gstRes.getStateCode())
                    .nameMatched(gstRes.isNameMatched())
                    .status(gstRes.getStatus())
                    .complianceScore(isValid ? 92.0 : 30.0)
                    .riskLevel(isValid ? "LOW" : "CRITICAL")
                    .filingRatePercent(isValid ? 91.0 : 0.0)
                    .gstr3bFilingStatus(isValid ? "Regular" : "Non-compliant")
                    .message(gstRes.getMessage())
                    .isMlVerified(false)
                    .verificationSource("FALLBACK_DATABASE")
                    .build();
        }
    }

    private boolean isNameMatch(String name1, String name2) {
        String clean1 = name1.toLowerCase().replaceAll("[^a-z0-9]", "");
        String clean2 = name2.toLowerCase().replaceAll("[^a-z0-9]", "");
        return clean1.contains(clean2) || clean2.contains(clean1);
    }

    private String extractString(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val instanceof String s && !s.isBlank()) {
                return s;
            }
        }
        return null;
    }

    private Double extractDouble(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val instanceof Number n) {
                return n.doubleValue();
            }
        }
        return null;
    }
}
