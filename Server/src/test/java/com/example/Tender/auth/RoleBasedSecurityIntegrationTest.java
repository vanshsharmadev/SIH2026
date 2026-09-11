package com.example.Tender.auth;

import com.example.Tender.auth.dto.LoginRequest;
import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.security.service.jwt.BidderJwtUtils;
import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.model.OfficerRole;
import com.example.Tender.officer.model.OfficerVerificationStatus;
import com.example.Tender.officer.repository.OfficerRepository;
import com.example.Tender.officer.security.jwt.OfficerJwtUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class RoleBasedSecurityIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private OfficerRepository officerRepository;

    @Autowired
    private BidderRepository bidderRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OfficerJwtUtils officerJwtUtils;

    @Autowired
    private BidderJwtUtils bidderJwtUtils;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String OFFICER_EMAIL = "security.officer.test@gem.gov.in";
    private static final String BIDDER_EMAIL = "security.bidder.test@acme.com";

    private String officerToken;
    private String bidderToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        cleanDatabase();

        Officer officer = officerRepository.save(Officer.builder()
                .name("Security Officer")
                .departmentId(1)
                .departmentName("Procurement")
                .email(OFFICER_EMAIL)
                .mobile("9876500001")
                .password(passwordEncoder.encode("Password@123"))
                .role(OfficerRole.ROLE_OFFICER)
                .verificationStatus(OfficerVerificationStatus.VERIFIED)
                .build());

        Bidder bidder = bidderRepository.save(Bidder.builder()
                .legalName("Security Bidder Enterprise")
                .email(BIDDER_EMAIL)
                .password(passwordEncoder.encode("Password@123"))
                .role("BIDDER")
                .isVerified(true)
                .build());

        officerToken = officerJwtUtils.generateTokenWithClaims(
                officer.getEmail(),
                officer.getId(),
                "OFFICER",
                officer.getName()
        );

        bidderToken = bidderJwtUtils.generateTokenWithClaims(
                bidder.getEmail(),
                bidder.getId(),
                "BIDDER",
                bidder.getLegalName()
        );
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        officerRepository.findByEmail(OFFICER_EMAIL).ifPresent(officerRepository::delete);
        bidderRepository.findByEmail(BIDDER_EMAIL).ifPresent(bidderRepository::delete);
    }

    // =========================================================================
    // 1. UNIFIED LOGIN ENDPOINTS (POST /auth/login and POST /api/auth/login)
    // =========================================================================

    @Test
    @DisplayName("Unified Login: POST /auth/login successfully logs in Officer and detects OFFICER role")
    void testUnifiedLogin_Officer_Success() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email(OFFICER_EMAIL)
                .password("Password@123")
                .build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.role", is("OFFICER")))
                .andExpect(jsonPath("$.user.email", is(OFFICER_EMAIL)))
                .andExpect(jsonPath("$.user.name", is("Security Officer")));
    }

    @Test
    @DisplayName("Unified Login: POST /api/auth/login successfully logs in Bidder and detects BIDDER role")
    void testUnifiedLogin_Bidder_Success() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email(BIDDER_EMAIL)
                .password("Password@123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.role", is("BIDDER")))
                .andExpect(jsonPath("$.user.email", is(BIDDER_EMAIL)))
                .andExpect(jsonPath("$.user.name", is("Security Bidder Enterprise")));
    }

    @Test
    @DisplayName("Unified Login: POST /auth/login returns 401 on invalid credentials")
    void testUnifiedLogin_BadCredentials_Returns401() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email(OFFICER_EMAIL)
                .password("WrongPassword999")
                .build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    // =========================================================================
    // 2. UNAUTHENTICATED REQUESTS RETURN 401 UNAUTHORIZED
    // =========================================================================

    @Test
    @DisplayName("401 Check: Unauthenticated access to Officer API returns 401 Unauthorized")
    void testUnauthenticated_OfficerApi_Returns401() throws Exception {
        mockMvc.perform(get("/api/officer/tenders"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("401 Check: Unauthenticated access to Bidder API returns 401 Unauthorized")
    void testUnauthenticated_BidderApi_Returns401() throws Exception {
        mockMvc.perform(get("/api/bidder/documents"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    // =========================================================================
    // 3. ROLE-BASED ACCESS CONTROL RETURNS 403 FORBIDDEN FOR WRONG ROLE
    // =========================================================================

    @Test
    @DisplayName("403 Check: Authenticated Bidder accessing Officer API returns 403 Forbidden")
    void testBidderToken_AccessingOfficerApi_Returns403() throws Exception {
        mockMvc.perform(get("/api/officer/tenders")
                        .header("Authorization", "Bearer " + bidderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.error", is("Forbidden")))
                .andExpect(jsonPath("$.message", containsString("Access denied")));
    }

    @Test
    @DisplayName("403 Check: Authenticated Officer accessing Bidder API returns 403 Forbidden")
    void testOfficerToken_AccessingBidderApi_Returns403() throws Exception {
        mockMvc.perform(get("/api/bidder/documents")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.error", is("Forbidden")))
                .andExpect(jsonPath("$.message", containsString("Access denied")));
    }

    // =========================================================================
    // 4. AUTHORIZED ROLE ACCESS SUCCEEDS (NOT 401 OR 403)
    // =========================================================================

    @Test
    @DisplayName("Authorized Check: Authenticated Officer accessing Officer API is allowed")
    void testOfficerToken_AccessingOfficerApi_Success() throws Exception {
        mockMvc.perform(get("/api/officer/tenders")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("Authorized Check: Authenticated Bidder accessing Bidder API is allowed")
    void testBidderToken_AccessingBidderApi_Success() throws Exception {
        mockMvc.perform(get("/api/bidder/documents")
                        .header("Authorization", "Bearer " + bidderToken))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 5. PUBLIC / STATUTORY ENDPOINTS REMAIN ACCESSIBLE WITHOUT AUTHENTICATION
    // =========================================================================

    @Test
    @DisplayName("Public Access: Document types endpoint is accessible without token (not 401 or 403)")
    void testPublicEndpoint_DocumentTypes_AccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/officer/tenders/document-types"))
                .andExpect(status().is(not(isOneOf(401, 403))));
    }

    @Test
    @DisplayName("Public Access: RAG health endpoint is accessible without token")
    void testPublicEndpoint_RagHealth_Returns200() throws Exception {
        mockMvc.perform(get("/api/officer/tenders/rag-health"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 6. PROFILE ENDPOINT /auth/me RESOLVES ROLE ACCURATELY
    // =========================================================================

    @Test
    @DisplayName("Profile Check: GET /auth/me with Officer token returns OFFICER profile")
    void testAuthMe_WithOfficerToken() throws Exception {
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.user.role", is("OFFICER")))
                .andExpect(jsonPath("$.user.email", is(OFFICER_EMAIL)));
    }

    @Test
    @DisplayName("Profile Check: GET /api/auth/me with Bidder token returns BIDDER profile")
    void testApiAuthMe_WithBidderToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + bidderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.user.role", is("BIDDER")))
                .andExpect(jsonPath("$.user.email", is(BIDDER_EMAIL)));
    }
}
