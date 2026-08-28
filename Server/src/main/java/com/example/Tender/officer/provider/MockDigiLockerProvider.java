package com.example.Tender.officer.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Mock DigiLocker Provider for development and SIH demo.
 * Simulates DigiLocker identity provider responses with controlled dummy data.
 */
@Slf4j
@Component
@Primary
public class MockDigiLockerProvider implements DigiLockerProvider {

    public static final String PROVIDER_NAME = "DIGILOCKER_MOCK";
    public static final String DEFAULT_MOCK_DIGILOCKER_ID = "DL-DEMO-001";
    public static final String DEFAULT_MOCK_NAME = "Arnav Tyagi";
    public static final LocalDate DEFAULT_MOCK_DOB = LocalDate.of(2003, 5, 15);
    public static final String DEFAULT_MOCK_GENDER = "M";
    public static final String DEFAULT_IDENTITY_STATUS = "VERIFIED";

    @Value("${app.server.base-url:http://localhost:8080}")
    private String baseUrl;

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public String generateVerificationUrl(String tempToken) {
        if (!StringUtils.hasText(tempToken)) {
            throw new IllegalArgumentException("Temporary token cannot be empty when generating verification URL");
        }
        return baseUrl + "/api/officer/identity/mock-login?token=" + tempToken.trim();
    }

    @Override
    public DigiLockerIdentity fetchIdentity(String tempToken, String authCode) {
        log.info("[MOCK DIGILOCKER] Fetching simulated identity for token: {}, authCode: {}", tempToken, authCode);

        return new DigiLockerIdentity(
                DEFAULT_MOCK_DIGILOCKER_ID,
                DEFAULT_MOCK_NAME,
                DEFAULT_MOCK_DOB,
                DEFAULT_MOCK_GENDER,
                PROVIDER_NAME,
                DEFAULT_IDENTITY_STATUS,
                LocalDateTime.now()
        );
    }
}
