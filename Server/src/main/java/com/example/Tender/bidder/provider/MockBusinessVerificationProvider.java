package com.example.Tender.bidder.provider;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import com.example.Tender.bidder.entity.MockPanRecord;
import com.example.Tender.bidder.repository.MockPanRecordRepository;
import lombok.RequiredArgsConstructor;
import com.example.Tender.bidder.entity.MockGstRecord;
import com.example.Tender.bidder.repository.MockGstRecordRepository;
import java.util.Optional;
import com.example.Tender.bidder.entity.MockUdyamRecord;
import com.example.Tender.bidder.repository.MockUdyamRecordRepository;

import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class MockBusinessVerificationProvider {

    private final MockPanRecordRepository mockPanRecordRepository;

    private final MockGstRecordRepository mockGstRecordRepository;

    private final MockUdyamRecordRepository mockUdyamRecordRepository;

    // Standard Indian Government Registration Regex Patterns
    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]{1}$");
    private static final Pattern GST_PATTERN = Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");
    private static final Pattern UDYAM_PATTERN = Pattern.compile("^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$");

    @Getter
    @Builder
    public static class PanVerificationResult {
        private String panNumber;
        private String registeredName;
        private String status; // "VALID", "INVALID"
        private String panCategory; // "COMPANY", "FIRM", "INDIVIDUAL"
        private boolean nameMatched;
        private String message;
    }

    @Getter
    @Builder
    public static class GstVerificationResult {
        private String gstNumber;
        private String legalName;
        private String tradeName;
        private String status; // "ACTIVE", "INACTIVE"
        private String stateCode;
        private String panExtracted;
        private boolean nameMatched;
        private boolean panConsistent;
        private String message;
    }

    @Getter
    @Builder
    public static class UdyamVerificationResult {
        private String udyamNumber;
        private String enterpriseName;
        private String enterpriseType; // "MICRO", "SMALL", "MEDIUM"
        private String majorActivity; // "SERVICES", "MANUFACTURING"
        private String status; // "VERIFIED", "INVALID"
        private boolean nameMatched;
        private String message;
    }

    /**
     * Verifies PAN number format and matches against the bidder's legal name.
     */
    public PanVerificationResult verifyPan(String panNumber, String expectedLegalName, String simulatedNameOverride, Boolean simulateFailure) {
        if (Boolean.TRUE.equals(simulateFailure)) {
            return PanVerificationResult.builder()
                    .panNumber(panNumber)
                    .status("INVALID")
                    .nameMatched(false)
                    .message("Simulated PAN verification failure: PAN not found in NSDL/ITD database")
                    .build();
        }

        String normalizedPan = panNumber != null ? panNumber.trim().toUpperCase() : "";

        if (!PAN_PATTERN.matcher(normalizedPan).matches()) {
            return PanVerificationResult.builder()
                    .panNumber(normalizedPan)
                    .status("INVALID")
                    .nameMatched(false)
                    .message("Invalid PAN format. Standard format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)")
                    .build();
        }

        Optional<MockPanRecord> record =
                mockPanRecordRepository.findByPanNumber(normalizedPan);

        if (record.isEmpty()) {
            return PanVerificationResult.builder()
                    .panNumber(normalizedPan)
                    .status("INVALID")
                    .nameMatched(false)
                    .message("PAN not found in mock government database")
                    .build();
        }

        MockPanRecord panRecord = record.get();

        String registeredName = panRecord.getRegisteredName();

        boolean nameMatched = isNameFuzzyMatch(expectedLegalName, registeredName);

        return PanVerificationResult.builder()
                .panNumber(normalizedPan)
                .registeredName(registeredName)
                .status("VALID")
                .panCategory(panRecord.getPanCategory())
                .nameMatched(nameMatched)
                .message(nameMatched
                        ? "PAN verified successfully and name matched"
                        : "PAN is valid but registered name does not match legal name")
                .build();
    }

    /**
     * Verifies GSTIN format, ensures PAN consistency, and matches against bidder legal name.
     */
    public GstVerificationResult verifyGst(String gstNumber, String expectedPan, String expectedLegalName, String simulatedNameOverride, Boolean simulateFailure) {
        if (Boolean.TRUE.equals(simulateFailure)) {
            return GstVerificationResult.builder()
                    .gstNumber(gstNumber)
                    .status("INACTIVE")
                    .nameMatched(false)
                    .panConsistent(false)
                    .message("Simulated GSTIN verification failure: GSTIN cancelled or inactive in GSTN database")
                    .build();
        }

        String normalizedGst = gstNumber != null ? gstNumber.trim().toUpperCase() : "";

        if (!GST_PATTERN.matcher(normalizedGst).matches()) {
            return GstVerificationResult.builder()
                    .gstNumber(normalizedGst)
                    .status("INVALID")
                    .nameMatched(false)
                    .panConsistent(false)
                    .message("Invalid GSTIN format. Standard format: 15 alphanumeric characters (e.g. 27ABCDE1234F1Z5)")
                    .build();
        }

        Optional<MockGstRecord> record =
                mockGstRecordRepository.findByGstNumber(normalizedGst);

        if (record.isEmpty()) {
            return GstVerificationResult.builder()
                    .gstNumber(normalizedGst)
                    .status("INACTIVE")
                    .nameMatched(false)
                    .panConsistent(false)
                    .message("GSTIN not found in mock government database")
                    .build();
        }

        MockGstRecord gstRecord = record.get();

        String extractedPan = gstRecord.getPanNumber();

        boolean panConsistent = true;

        if (StringUtils.hasText(expectedPan)) {
            String normalizedExpectedPan = expectedPan.trim().toUpperCase();
            panConsistent = extractedPan.equals(normalizedExpectedPan);
        }

        boolean nameMatched =
                isNameFuzzyMatch(expectedLegalName, gstRecord.getLegalName());

        return GstVerificationResult.builder()
                .gstNumber(normalizedGst)
                .legalName(gstRecord.getLegalName())
                .tradeName(gstRecord.getLegalName() + " TRADING")
                .status(gstRecord.getStatus())
                .stateCode(gstRecord.getStateCode())
                .panExtracted(extractedPan)
                .nameMatched(nameMatched)
                .panConsistent(panConsistent)
                .message(
                        nameMatched && panConsistent
                                ? "GSTIN verified active and matched with PAN and legal name"
                                : (!panConsistent
                                   ? "GSTIN does not match provided PAN number"
                                   : "GSTIN is active but legal name does not match")
                )
                .build();
    }

    /**
     * Verifies MSME Udyam registration number format and matches against legal name.
     */
    public UdyamVerificationResult verifyUdyam(String udyamNumber, String expectedLegalName, String simulatedNameOverride, Boolean simulateFailure) {
        if (Boolean.TRUE.equals(simulateFailure)) {
            return UdyamVerificationResult.builder()
                    .udyamNumber(udyamNumber)
                    .status("INVALID")
                    .nameMatched(false)
                    .message("Simulated Udyam verification failure: Registration number not found on MSME portal")
                    .build();
        }

        String normalizedUdyam = udyamNumber != null
                ? udyamNumber.trim().toUpperCase()
                : "";

        // Check if matches standard UDYAM-XX-00-0000000 format
        if (!UDYAM_PATTERN.matcher(normalizedUdyam).matches() && !normalizedUdyam.startsWith("UDYAM-")) {
            return UdyamVerificationResult.builder()
                    .udyamNumber(normalizedUdyam)
                    .status("INVALID")
                    .nameMatched(false)
                    .message("Invalid Udyam registration format. Standard format: UDYAM-ST-00-0000000 (e.g. UDYAM-MH-01-0123456)")
                    .build();
        }

        Optional<MockUdyamRecord> record =
                mockUdyamRecordRepository.findByUdyamNumber(normalizedUdyam);

        if (record.isEmpty()) {
            return UdyamVerificationResult.builder()
                    .udyamNumber(normalizedUdyam)
                    .status("INVALID")
                    .nameMatched(false)
                    .message("Udyam number not found in mock government database")
                    .build();
        }

        MockUdyamRecord udyamRecord = record.get();

        String enterpriseName = udyamRecord.getEnterpriseName();

        boolean nameMatched =
                isNameFuzzyMatch(expectedLegalName, enterpriseName);

        return UdyamVerificationResult.builder()
                .udyamNumber(normalizedUdyam)
                .enterpriseName(enterpriseName)
                .enterpriseType(udyamRecord.getEnterpriseType())
                .majorActivity(udyamRecord.getMajorActivity())
                .status(udyamRecord.getStatus())
                .nameMatched(nameMatched)
                .message(nameMatched
                        ? "Udyam MSME registration verified successfully"
                        : "Udyam number exists but enterprise name does not match")
                .build();
    }

    private boolean isNameFuzzyMatch(String expected, String actual) {
        if (expected == null || actual == null) return false;
        String expNorm = expected.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
        String actNorm = actual.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
        return expNorm.equals(actNorm) || expNorm.contains(actNorm) || actNorm.contains(expNorm);
    }
}
