package com.example.Tender.officer.service;

import java.time.LocalDateTime;

public interface DigiLockerService {

    /**
     * Generates the secure DigiLocker OAuth 2.0 authorization URL bound to the temporary registration state.
     *
     * @param tempToken Secure state token representing the pending temporary registration
     * @return Full authorization URL for client redirection
     */
    String generateAuthorizationUrl(String tempToken);

    /**
     * Validates and exchanges the authorization code with DigiLocker to extract the verified officer identity.
     *
     * @param code Authorization code from DigiLocker
     * @param state State token returned from DigiLocker (must match tempToken)
     * @return Verified identity metadata
     */
    DigiLockerIdentity processAuthorizationCallback(String code, String state);

    record DigiLockerIdentity(
            String digilockerId,
            String name,
            String identityProvider,
            LocalDateTime verifiedAt
    ) {}
}
