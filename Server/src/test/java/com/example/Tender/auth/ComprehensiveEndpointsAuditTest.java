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
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ComprehensiveEndpointsAuditTest {

    @Autowired
    private WebApplicationContext context;

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

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String OFFICER_EMAIL = "audit.officer@gem.gov.in";
    private static final String BIDDER_EMAIL = "audit.bidder@acme.com";

    private String officerToken;
    private String bidderToken;

    @BeforeAll
    void init() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        cleanDb();

        Officer officer = officerRepository.save(Officer.builder()
                .name("Audit Officer")
                .departmentId(1)
                .departmentName("Auditing")
                .email(OFFICER_EMAIL)
                .mobile("9111222333")
                .password(passwordEncoder.encode("SecretPassword@1"))
                .role(OfficerRole.ROLE_OFFICER)
                .verificationStatus(OfficerVerificationStatus.VERIFIED)
                .build());

        Bidder bidder = bidderRepository.save(Bidder.builder()
                .legalName("Audit Bidder Corp")
                .email(BIDDER_EMAIL)
                .password(passwordEncoder.encode("SecretPassword@1"))
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

    @AfterAll
    void cleanup() {
        cleanDb();
    }

    private void cleanDb() {
        officerRepository.findByEmail(OFFICER_EMAIL).ifPresent(officerRepository::delete);
        bidderRepository.findByEmail(BIDDER_EMAIL).ifPresent(bidderRepository::delete);
    }

    // =========================================================================
    // SECTION 1: UNIFIED AUTHENTICATION APIS (/auth/login, /api/auth/login, /auth/me)
    // =========================================================================

    @Test
    @DisplayName("POST /auth/login - Officer login returns 200 with JWT and OFFICER role")
    void testAuthLogin_Officer() throws Exception {
        LoginRequest req = LoginRequest.builder().email(OFFICER_EMAIL).password("SecretPassword@1").build();
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.role", is("OFFICER")));
    }

    @Test
    @DisplayName("POST /api/auth/login - Bidder login returns 200 with JWT and BIDDER role")
    void testApiAuthLogin_Bidder() throws Exception {
        LoginRequest req = LoginRequest.builder().email(BIDDER_EMAIL).password("SecretPassword@1").build();
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.role", is("BIDDER")));
    }

    @Test
    @DisplayName("POST /auth/login - Invalid password returns 401 Unauthorized")
    void testAuthLogin_InvalidPassword_Returns401() throws Exception {
        LoginRequest req = LoginRequest.builder().email(OFFICER_EMAIL).password("WrongPassword").build();
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /auth/login - Blank fields return 400 Bad Request")
    void testAuthLogin_BlankFields_Returns400() throws Exception {
        LoginRequest req = LoginRequest.builder().email("").password("").build();
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /auth/me - Unauthenticated returns 401")
    void testAuthMe_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /auth/me - Officer token returns 200 with role OFFICER")
    void testAuthMe_Officer_Returns200() throws Exception {
        mockMvc.perform(get("/auth/me").header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role", is("OFFICER")));
    }

    @Test
    @DisplayName("GET /api/auth/me - Bidder token returns 200 with role BIDDER")
    void testApiAuthMe_Bidder_Returns200() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + bidderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role", is("BIDDER")));
    }

    // =========================================================================
    // SECTION 2: OFFICER-ONLY APIS (/api/officer/**)
    // =========================================================================

    @Test
    @DisplayName("GET /api/officer/tenders - Unauthenticated returns 401")
    void testOfficerTenders_NoToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/officer/tenders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/officer/tenders - Bidder token returns 403 Forbidden")
    void testOfficerTenders_BidderToken_Returns403() throws Exception {
        mockMvc.perform(get("/api/officer/tenders").header("Authorization", "Bearer " + bidderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.error", is("Forbidden")));
    }

    @Test
    @DisplayName("GET /api/officer/tenders - Officer token returns 200 OK")
    void testOfficerTenders_OfficerToken_Returns200() throws Exception {
        mockMvc.perform(get("/api/officer/tenders").header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("POST /api/officer/tenders/upload - Bidder token returns 403 Forbidden")
    void testOfficerTendersUpload_BidderToken_Returns403() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "tender.pdf", "application/pdf", "dummy pdf".getBytes());
        mockMvc.perform(multipart("/api/officer/tenders/upload")
                        .file(file)
                        .param("title", "Tender Title")
                        .header("Authorization", "Bearer " + bidderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("POST /api/officer/tenders/1/compare-bidders - Bidder token returns 403 Forbidden")
    void testOfficerCompareBidders_BidderToken_Returns403() throws Exception {
        mockMvc.perform(post("/api/officer/tenders/1/compare-bidders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bidders\":[]}")
                        .header("Authorization", "Bearer " + bidderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    // =========================================================================
    // SECTION 3: BIDDER-ONLY APIS (/api/bidder/**)
    // =========================================================================

    @Test
    @DisplayName("GET /api/bidder/documents - Unauthenticated returns 401")
    void testBidderDocuments_NoToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/bidder/documents"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/bidder/documents - Officer token returns 403 Forbidden")
    void testBidderDocuments_OfficerToken_Returns403() throws Exception {
        mockMvc.perform(get("/api/bidder/documents").header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.error", is("Forbidden")));
    }

    @Test
    @DisplayName("GET /api/bidder/documents - Bidder token returns 200 OK")
    void testBidderDocuments_BidderToken_Returns200() throws Exception {
        mockMvc.perform(get("/api/bidder/documents").header("Authorization", "Bearer " + bidderToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/bidder/documents/upload - Officer token returns 403 Forbidden")
    void testBidderDocumentsUpload_OfficerToken_Returns403() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "cert.pdf", "application/pdf", "dummy cert".getBytes());
        mockMvc.perform(multipart("/api/bidder/documents/upload")
                        .file(file)
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("POST /api/bidder/documents/check-cis - Officer token returns 403 Forbidden")
    void testBidderCheckCis_OfficerToken_Returns403() throws Exception {
        mockMvc.perform(post("/api/bidder/documents/check-cis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("POST /api/bidder/documents/audit-submission - Officer token returns 403 Forbidden")
    void testBidderAuditSubmission_OfficerToken_Returns403() throws Exception {
        mockMvc.perform(post("/api/bidder/documents/audit-submission")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("GET /api/bidder/documents/overall-summary - Officer token returns 403 Forbidden")
    void testBidderOverallSummary_OfficerToken_Returns403() throws Exception {
        mockMvc.perform(get("/api/bidder/documents/overall-summary")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("GET /api/bidder - Officer token returns 403 Forbidden")
    void testBidderCrud_OfficerToken_Returns403() throws Exception {
        mockMvc.perform(get("/api/bidder").header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("GET /api/bidder - Bidder token returns 200 OK")
    void testBidderCrud_BidderToken_Returns200() throws Exception {
        mockMvc.perform(get("/api/bidder").header("Authorization", "Bearer " + bidderToken))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // SECTION 4: PUBLIC STATUTORY & HEALTH APIS
    // =========================================================================

    @Test
    @DisplayName("GET /api/ai/health - Public access returns 200 OK")
    void testAiHealth_Public_Returns200() throws Exception {
        mockMvc.perform(get("/api/ai/health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/officer/tenders/rag-health - Public access returns 200 OK")
    void testRagHealth_Public_Returns200() throws Exception {
        mockMvc.perform(get("/api/officer/tenders/rag-health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/bidder/documents/tender-requirements - Public access not 401 or 403")
    void testTenderRequirements_PublicAccess_Allowed() throws Exception {
        mockMvc.perform(post("/api/bidder/documents/tender-requirements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().is(not(isOneOf(401, 403))));
    }

    @Test
    @DisplayName("POST /api/bidder/documents/predict-compliance - Public access not 401 or 403")
    void testPredictCompliance_PublicAccess_Allowed() throws Exception {
        mockMvc.perform(post("/api/bidder/documents/predict-compliance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().is(not(isOneOf(401, 403))));
    }

    // =========================================================================
    // SECTION 5: DEDICATED AUTH ENDPOINTS (BACKWARD COMPATIBILITY)
    // =========================================================================

    @Test
    @DisplayName("POST /api/officer/auth/login - Dedicated endpoint returns 401 on bad credentials")
    void testOfficerDedicatedLogin_BadCredentials() throws Exception {
        mockMvc.perform(post("/api/officer/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"emailOrMobile\":\"unknown@gov.in\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/bidder/auth/login - Dedicated endpoint returns 401 on bad credentials")
    void testBidderDedicatedLogin_BadCredentials() throws Exception {
        mockMvc.perform(post("/api/bidder/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"unknown@acme.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/bidder/auth/me - Bidder token returns 200 OK")
    void testBidderAuthMe_WithToken() throws Exception {
        mockMvc.perform(get("/api/bidder/auth/me")
                        .header("Authorization", "Bearer " + bidderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid", is(true)))
                .andExpect(jsonPath("$.email", is(BIDDER_EMAIL)));
    }

    @Test
    @DisplayName("GET /api/officer/auth/me - Officer token returns 200 OK")
    void testOfficerAuthMe_WithToken() throws Exception {
        mockMvc.perform(get("/api/officer/auth/me")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is(OFFICER_EMAIL)));
    }

    // =========================================================================
    // SECTION 6: BIDDER CHAT SECURITY
    // =========================================================================

    @Test
    @DisplayName("POST /api/bidder/chat - Unauthenticated request is rejected by Spring Security")
    void testBidderChat_Unauthenticated_Rejected() throws Exception {
        mockMvc.perform(post("/api/bidder/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tenderId\":\"TND-1\",\"query\":\"What is turnover?\"}"))
                .andExpect(status().is(isOneOf(401, 403)));
    }

    @Test
    @DisplayName("POST /api/bidder/chat - Authenticated bidder token is authorized through Spring Security")
    void testBidderChat_WithBidderToken_Authorized() throws Exception {
        // Validation failure proves request passed Spring Security ROLE_BIDDER filter
        mockMvc.perform(post("/api/bidder/chat")
                        .header("Authorization", "Bearer " + bidderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tenderId\":\"\",\"query\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Validation Failed")));
    }
}
