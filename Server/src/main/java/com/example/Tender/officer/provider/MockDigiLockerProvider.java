package com.example.Tender.officer.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@Primary
public class MockDigiLockerProvider implements IdentityVerificationProvider {

    public static final String PROVIDER_NAME = "DIGILOCKER_MOCK";

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
        return baseUrl + "/api/officer/identity/mock-verify?token=" + tempToken;
    }

    @Override
    public VerifiedIdentity fetchIdentity(String tempToken, String authCode) {
        log.info("[MOCK DIGILOCKER] Simulating identity retrieval for token: {}, code: {}", tempToken, authCode);

        // Standard controlled mock identity for development & SIH demo
        String mockDigilockerId = "DL-DEMO-001";
        String mockFullName = "Arnav Tyagi";
        LocalDate mockDob = LocalDate.of(2003, 5, 15);
        String mockGender = "M";

        return new VerifiedIdentity(
                mockDigilockerId,
                mockFullName,
                mockDob,
                mockGender,
                PROVIDER_NAME,
                LocalDateTime.now()
        );
    }
}
