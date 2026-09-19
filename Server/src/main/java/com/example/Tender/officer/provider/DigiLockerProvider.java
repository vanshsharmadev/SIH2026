package com.example.Tender.officer.provider;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DigiLocker Provider Abstraction.
 * Exposes operations for initiating and completing/verifying identity verification.
 */
public interface DigiLockerProvider {

    /**
     * Unique identifier of the provider (e.g. "DIGILOCKER_MOCK", "DIGILOCKER_REAL")
     */
    String getProviderName();

    /**
     * Generates authorization / verification URL for the client to prove identity in mock/real flow.
     */
    String generateVerificationUrl(String tempToken);

    /**
     * Retrieves the verified identity from the provider using the session token or auth code.
     */
    DigiLockerIdentity fetchIdentity(String tempToken, String authCode);

    /**
     * Standard identity data record returned by DigiLocker providers.
     */
    record DigiLockerIdentity(
            String digilockerId,
            String fullName,
            LocalDate dateOfBirth,
            String gender,
            String identityProvider,
            String identityStatus,
            LocalDateTime verifiedAt
    ) {}
}
