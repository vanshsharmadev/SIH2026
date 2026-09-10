package com.example.Tender.auth.controller;

import com.example.Tender.auth.dto.AuthUserDto;
import com.example.Tender.auth.dto.LoginRequest;
import com.example.Tender.auth.dto.LoginResponse;
import com.example.Tender.auth.exception.AuthGlobalExceptionHandler;
import com.example.Tender.auth.service.CommonAuthService;
import com.example.Tender.bidder.exception.BidderNotVerifiedException;
import com.example.Tender.officer.service.OfficerAuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CommonAuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CommonAuthService commonAuthService;

    @Mock
    private OfficerAuthService officerAuthService;

    @InjectMocks
    private CommonAuthController commonAuthController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(commonAuthController)
                .setControllerAdvice(new AuthGlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /auth/login - 200 OK for Officer credentials")
    void testAuthLogin_OfficerSuccess() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("officer@gem.gov.in")
                .password("Secret@123")
                .build();

        LoginResponse response = LoginResponse.builder()
                .success(true)
                .message("Login successful")
                .token("jwt_officer_token")
                .user(AuthUserDto.builder()
                        .id(1L)
                        .name("Test Officer")
                        .email("officer@gem.gov.in")
                        .role("OFFICER")
                        .build())
                .build();

        when(commonAuthService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Login successful")))
                .andExpect(jsonPath("$.token", is("jwt_officer_token")))
                .andExpect(jsonPath("$.user.role", is("OFFICER")))
                .andExpect(jsonPath("$.user.email", is("officer@gem.gov.in")));
    }

    @Test
    @DisplayName("POST /api/auth/login - 200 OK for Bidder credentials (alias path)")
    void testApiAuthLogin_BidderSuccess() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("bidder@acme.com")
                .password("Password@123")
                .build();

        LoginResponse response = LoginResponse.builder()
                .success(true)
                .message("Login successful")
                .token("jwt_bidder_token")
                .user(AuthUserDto.builder()
                        .id(2L)
                        .name("ACME LTD")
                        .email("bidder@acme.com")
                        .role("BIDDER")
                        .build())
                .build();

        when(commonAuthService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Login successful")))
                .andExpect(jsonPath("$.token", is("jwt_bidder_token")))
                .andExpect(jsonPath("$.user.role", is("BIDDER")))
                .andExpect(jsonPath("$.user.name", is("ACME LTD")));
    }

    @Test
    @DisplayName("POST /auth/login - 401 Unauthorized on invalid credentials")
    void testAuthLogin_BadCredentials() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("wrong@example.com")
                .password("WrongPwd")
                .build();

        when(commonAuthService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error", is("Unauthorized")))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("POST /auth/login - 403 Forbidden on unverified bidder")
    void testAuthLogin_UnverifiedBidder() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("unverified@example.com")
                .password("Password@123")
                .build();

        when(commonAuthService.login(any(LoginRequest.class)))
                .thenThrow(new BidderNotVerifiedException("Account is not verified. Please complete verification."));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error", is("Forbidden")));
    }

    @Test
    @DisplayName("POST /auth/login - 400 Bad Request on blank email and password")
    void testAuthLogin_ValidationFailure() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("")
                .password("")
                .build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error", is("Validation Failed")));
    }

    @Test
    @DisplayName("GET /auth/me - 200 OK when authenticated")
    void testAuthMe_Authenticated() throws Exception {
        AuthUserDto profile = AuthUserDto.builder()
                .id(101L)
                .name("Vikram Sharma")
                .email("officer@gem.gov.in")
                .role("OFFICER")
                .build();

        when(commonAuthService.getCurrentUserProfile(any())).thenReturn(profile);

        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.user.role", is("OFFICER")))
                .andExpect(jsonPath("$.user.email", is("officer@gem.gov.in")));
    }

    @Test
    @DisplayName("GET /auth/me - 401 Unauthorized when unauthenticated")
    void testAuthMe_Unauthenticated() throws Exception {
        when(commonAuthService.getCurrentUserProfile(any())).thenReturn(null);

        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }
}
