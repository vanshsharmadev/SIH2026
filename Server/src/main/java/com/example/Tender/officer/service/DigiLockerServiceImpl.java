package com.example.Tender.officer.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
public class DigiLockerServiceImpl implements DigiLockerService {

    @Value("${digilocker.client.id}")
    private String clientId;

    @Value("${digilocker.client.secret}")
    private String clientSecret;

    @Value("${digilocker.redirect.uri}")
    private String redirectUri;

    @Value("${digilocker.auth.url:https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize}")
    private String authUrl;

    @Value("${digilocker.token.url:https://digilocker.meripehchaan.gov.in/public/oauth2/1/token}")
    private String tokenUrl;

    @Value("${digilocker.user.url:https://digilocker.meripehchaan.gov.in/public/oauth2/1/user}")
    private String userUrl;

    @Override
    public String generateAuthorizationUrl(String tempToken) {
        if (!StringUtils.hasText(tempToken)) {
            throw new IllegalArgumentException("Invalid temporary token for DigiLocker authorization");
        }

        return UriComponentsBuilder.fromUriString(authUrl)
                .queryParam("response_type", "code")
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("state", tempToken)
                .toUriString();
    }

    @Override
    @SuppressWarnings("unchecked")
    public DigiLockerIdentity processAuthorizationCallback(String code, String state) {
        if (!StringUtils.hasText(code)) {
            throw new IllegalArgumentException("Authorization code is missing from DigiLocker callback");
        }

        if ("YOUR_DIGILOCKER_CLIENT_ID".equals(clientId) || "YOUR_DIGILOCKER_CLIENT_SECRET".equals(clientSecret)) {
            log.error("DigiLocker client credentials are not configured in environment/properties.");
            throw new IllegalStateException("DigiLocker service credentials are not configured. Please configure DIGILOCKER_CLIENT_ID and DIGILOCKER_CLIENT_SECRET in the server environment.");
        }

        try {
            RestClient restClient = RestClient.builder().build();

            // 1. Exchange authorization code for OAuth access token
            MultiValueMap<String, String> tokenRequestBody = new LinkedMultiValueMap<>();
            tokenRequestBody.add("grant_type", "authorization_code");
            tokenRequestBody.add("code", code);
            tokenRequestBody.add("client_id", clientId);
            tokenRequestBody.add("client_secret", clientSecret);
            tokenRequestBody.add("redirect_uri", redirectUri);

            Map<String, Object> tokenResponse = restClient.post()
                    .uri(tokenUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(tokenRequestBody)
                    .retrieve()
                    .body(Map.class);

            if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
                throw new IllegalStateException("Failed to obtain access token from DigiLocker");
            }

            String accessToken = (String) tokenResponse.get("access_token");

            // 2. Fetch authenticated officer profile / identity from DigiLocker
            Map<String, Object> userInfo = restClient.get()
                    .uri(userUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(Map.class);

            if (userInfo == null) {
                throw new IllegalStateException("Failed to retrieve user identity from DigiLocker");
            }

            String digilockerId = (String) userInfo.getOrDefault("digilockerid", userInfo.get("sub"));
            String name = (String) userInfo.getOrDefault("name", "Verified Officer");

            if (!StringUtils.hasText(digilockerId)) {
                throw new IllegalStateException("DigiLocker did not return a valid unique identifier");
            }

            return new DigiLockerIdentity(
                    digilockerId,
                    name,
                    "DIGILOCKER",
                    LocalDateTime.now()
            );
        } catch (Exception e) {
            log.error("Error during DigiLocker OAuth code exchange: {}", e.getMessage());
            throw new IllegalStateException("DigiLocker identity verification failed: " + e.getMessage(), e);
        }
    }
}
