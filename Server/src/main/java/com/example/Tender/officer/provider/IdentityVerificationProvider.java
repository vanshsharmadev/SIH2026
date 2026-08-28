package com.example.Tender.officer.provider;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface IdentityVerificationProvider {

    /**
     * Unique identifier of the provider (e.g. "DIGILOCKER_MOCK", "DIGILOCKER_REAL")
     */
    String getProviderName();

    /**
     * Generates authorization / verification URL for the client to prove identity.
     */
    String generateVerificationUrl(String tempToken);

    /**
     * Retrieves the verified identity from the provider using the session/auth token.
     */
    VerifiedIdentity fetchIdentity(String tempToken, String authCode);

    record VerifiedIdentity(
            String digilockerId,
            String fullName,
            LocalDate dateOfBirth,
            String gender,
            String identityProvider,
            LocalDateTime verifiedAt
    ) {}
}
