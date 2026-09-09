package com.example.Tender.bidder.controller;

import com.example.Tender.bidder.dto.*;
import com.example.Tender.bidder.exception.*;
import com.example.Tender.bidder.service.BidderAuthService;
import com.example.Tender.bidder.service.BidderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class BidderEndpointTest {

        private MockMvc authMockMvc;
        private MockMvc bidderMockMvc;

        @Mock
        private BidderAuthService bidderAuthService;

        @Mock
        private BidderService bidderService;

        private final ObjectMapper objectMapper = new ObjectMapper();

        @BeforeEach
        void setUp() {
                GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();

                BidderAuthController authController = new BidderAuthController(bidderAuthService);
                this.authMockMvc = MockMvcBuilders.standaloneSetup(authController)
                                .setCustomArgumentResolvers(
                                                new org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver())
                                .setControllerAdvice(exceptionHandler)
                                .build();

                BidderController bidderController = new BidderController(bidderService);
                this.bidderMockMvc = MockMvcBuilders.standaloneSetup(bidderController)
                                .setControllerAdvice(exceptionHandler)
                                .build();
        }

        // ==========================================
        // 1. POST /api/bidder/auth/signup
        // ==========================================
        @Test
        @DisplayName("POST /signup - 201 Created on valid input")
        void testSignup_Success() throws Exception {
                BidderSignupRequest request = BidderSignupRequest.builder()
                                .legalName("ACME LTD")
                                .email("bidder@acme.com")
                                .password("Password@123")
                                .gstNumber("27ABCDE1234F1Z5")
                                .phone("9876543210")
                                .build();

                BidderInitiateResponse response = BidderInitiateResponse.builder()
                                .tempToken("token123")
                                .email("bidder@acme.com")
                                .legalName("ACME LTD")
                                .gstNumber("27ABCDE1234F1Z5")
                                .message("Signup initiated")
                                .build();

                when(bidderAuthService.signup(any())).thenReturn(response);

                authMockMvc.perform(post("/api/bidder/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.tempToken").value("token123"))
                                .andExpect(jsonPath("$.email").value("bidder@acme.com"))
                                .andExpect(jsonPath("$.legalName").value("ACME LTD"));
        }

        @Test
        @DisplayName("POST /signup - 400 Bad Request with validation errors on blank fields")
        void testSignup_ValidationFailure() throws Exception {
                BidderSignupRequest invalidRequest = BidderSignupRequest.builder()
                                .legalName("")
                                .email("not-an-email")
                                .password("")
                                .gstNumber("")
                                .build();

                authMockMvc.perform(post("/api/bidder/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(invalidRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Validation Failed"))
                                .andExpect(jsonPath("$.validationErrors.email").exists())
                                .andExpect(jsonPath("$.validationErrors.legalName").exists());
        }

        @Test
        @DisplayName("POST /signup - 400 Bad Request on BidderVerificationException")
        void testSignup_VerificationException() throws Exception {
                BidderSignupRequest request = BidderSignupRequest.builder()
                                .legalName("UNKNOWN LTD")
                                .email("bidder@acme.com")
                                .password("Password@123")
                                .gstNumber("27ABCDE1234F1Z5")
                                .build();

                when(bidderAuthService.signup(any()))
                                .thenThrow(new BidderVerificationException(
                                                "Invalid credentials: No verified bidder record found"));

                authMockMvc.perform(post("/api/bidder/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Verification Failed"))
                                .andExpect(jsonPath("$.message", containsString("No verified bidder record found")));
        }

        @Test
        @DisplayName("POST /signup - 409 Conflict on BidderAlreadyExistsException")
        void testSignup_AlreadyExistsException() throws Exception {
                BidderSignupRequest request = BidderSignupRequest.builder()
                                .legalName("ACME LTD")
                                .email("bidder@acme.com")
                                .password("Password@123")
                                .gstNumber("27ABCDE1234F1Z5")
                                .build();

                when(bidderAuthService.signup(any()))
                                .thenThrow(new BidderAlreadyExistsException(
                                                "Error: Email is already registered and verified!"));

                authMockMvc.perform(post("/api/bidder/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.status").value(409))
                                .andExpect(jsonPath("$.error").value("Conflict"))
                                .andExpect(jsonPath("$.message")
                                                .value("Error: Email is already registered and verified!"));
        }

        // ==========================================
        // 2. POST /api/bidder/auth/verify-otp
        // ==========================================
        @Test
        @DisplayName("POST /verify-otp - 200 OK on valid OTP")
        void testVerifyOtp_Success() throws Exception {
                BidderVerifyOtpRequest request = new BidderVerifyOtpRequest("bidder@acme.com", "123456");

                BidderAuthResponse response = BidderAuthResponse.builder()
                                .token("jwt-token-xyz")
                                .email("bidder@acme.com")
                                .legalName("ACME LTD")
                                .isVerified(true)
                                .build();

                when(bidderAuthService.verifyOtp(any())).thenReturn(response);

                authMockMvc.perform(post("/api/bidder/auth/verify-otp")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").value("jwt-token-xyz"))
                                .andExpect(jsonPath("$.email").value("bidder@acme.com"));
        }

        @Test
        @DisplayName("POST /verify-otp - 400 Bad Request on InvalidOtpException")
        void testVerifyOtp_InvalidOtp() throws Exception {
                BidderVerifyOtpRequest request = new BidderVerifyOtpRequest("bidder@acme.com", "000000");

                when(bidderAuthService.verifyOtp(any()))
                                .thenThrow(new InvalidOtpException("Error: Invalid OTP entered!"));

                authMockMvc.perform(post("/api/bidder/auth/verify-otp")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Invalid OTP"))
                                .andExpect(jsonPath("$.message").value("Error: Invalid OTP entered!"));
        }

        @Test
        @DisplayName("POST /verify-otp - 400 Bad Request on OtpExpiredException")
        void testVerifyOtp_OtpExpired() throws Exception {
                BidderVerifyOtpRequest request = new BidderVerifyOtpRequest("bidder@acme.com", "123456");

                when(bidderAuthService.verifyOtp(any()))
                                .thenThrow(new OtpExpiredException(
                                                "Error: OTP has expired. Please request a new OTP."));

                authMockMvc.perform(post("/api/bidder/auth/verify-otp")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("OTP Expired"));
        }

        // ==========================================
        // 3. POST /api/bidder/auth/resend-otp
        // ==========================================
        @Test
        @DisplayName("POST /resend-otp - 200 OK")
        void testResendOtp_Success() throws Exception {
                BidderResendOtpRequest request = new BidderResendOtpRequest("bidder@acme.com");

                when(bidderAuthService.resendOtp(any())).thenReturn("A fresh OTP has been sent to bidder@acme.com");

                authMockMvc.perform(post("/api/bidder/auth/resend-otp")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message", containsString("fresh OTP has been sent")));
        }

        @Test
        @DisplayName("POST /resend-otp - 409 Conflict when already registered")
        void testResendOtp_AlreadyRegistered() throws Exception {
                BidderResendOtpRequest request = new BidderResendOtpRequest("bidder@acme.com");

                when(bidderAuthService.resendOtp(any()))
                                .thenThrow(new BidderAlreadyExistsException(
                                                "Error: Account is already verified and registered in the main database!"));

                authMockMvc.perform(post("/api/bidder/auth/resend-otp")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.status").value(409))
                                .andExpect(jsonPath("$.error").value("Conflict"));
        }

        // ==========================================
        // 4. POST /api/bidder/auth/login
        // ==========================================
        @Test
        @DisplayName("POST /login - 200 OK on valid credentials")
        void testLogin_Success() throws Exception {
                BidderLoginRequest request = new BidderLoginRequest();
                request.setEmail("bidder@acme.com");
                request.setPassword("Password@123");

                BidderAuthResponse response = BidderAuthResponse.builder()
                                .token("jwt-token-123")
                                .email("bidder@acme.com")
                                .legalName("ACME LTD")
                                .build();

                when(bidderAuthService.login(any())).thenReturn(response);

                authMockMvc.perform(post("/api/bidder/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").value("jwt-token-123"));
        }

        @Test
        @DisplayName("POST /login - 401 Unauthorized on bad credentials")
        void testLogin_BadCredentials() throws Exception {
                BidderLoginRequest request = new BidderLoginRequest();
                request.setEmail("bidder@acme.com");
                request.setPassword("WrongPassword");

                when(bidderAuthService.login(any()))
                                .thenThrow(new BadCredentialsException("Invalid email or password"));

                authMockMvc.perform(post("/api/bidder/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.status").value(401))
                                .andExpect(jsonPath("$.error").value("Unauthorized"))
                                .andExpect(jsonPath("$.message").value("Invalid email or password"));
        }

        @Test
        @DisplayName("POST /login - 403 Forbidden on unverified bidder")
        void testLogin_NotVerified() throws Exception {
                BidderLoginRequest request = new BidderLoginRequest();
                request.setEmail("bidder@acme.com");
                request.setPassword("Password@123");

                when(bidderAuthService.login(any()))
                                .thenThrow(new BidderNotVerifiedException(
                                                "Account is not verified. Please complete verification."));

                authMockMvc.perform(post("/api/bidder/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.status").value(403))
                                .andExpect(jsonPath("$.error").value("Forbidden"));
        }

        // ==========================================
        // 5. POST & GET /api/bidder/auth/verify-token
        // ==========================================
        @Test
        @DisplayName("POST /verify-token - 200 OK")
        void testVerifyToken_Post() throws Exception {
                BidderTokenVerifyResponse response = BidderTokenVerifyResponse.builder()
                                .valid(true)
                                .tokenType("JWT")
                                .email("bidder@acme.com")
                                .build();

                when(bidderAuthService.verifyToken(any(), any(), any(), any())).thenReturn(response);

                authMockMvc.perform(post("/api/bidder/auth/verify-token")
                                .header("Authorization", "Bearer valid-token"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.valid").value(true))
                                .andExpect(jsonPath("$.tokenType").value("JWT"));
        }

        @Test
        @DisplayName("GET /verify-token - 200 OK")
        void testVerifyToken_Get() throws Exception {
                BidderTokenVerifyResponse response = BidderTokenVerifyResponse.builder()
                                .valid(true)
                                .tokenType("TEMP_TOKEN")
                                .email("bidder@acme.com")
                                .build();

                when(bidderAuthService.verifyToken(any(), any(), any(), any())).thenReturn(response);

                authMockMvc.perform(get("/api/bidder/auth/verify-token")
                                .param("tempToken", "temp123"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.valid").value(true));
        }

        // ==========================================
        // 6. GET /api/bidder/auth/me
        // ==========================================
        @Test
        @DisplayName("GET /me - 200 OK")
        void testGetMe() throws Exception {
                BidderTokenVerifyResponse response = BidderTokenVerifyResponse.builder()
                                .valid(true)
                                .email("bidder@acme.com")
                                .legalName("ACME LTD")
                                .build();

                when(bidderAuthService.verifyToken(any(), any(), any(), any())).thenReturn(response);

                authMockMvc.perform(get("/api/bidder/auth/me")
                                .header("Authorization", "Bearer valid-jwt"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.email").value("bidder@acme.com"));
        }

        // ==========================================
        // 7. Password Reset Flow Endpoints
        // ==========================================
        @Test
        @DisplayName("POST /forgot-password - 200 OK on existing email")
        void testForgotPassword_Success() throws Exception {
                ForgotPasswordRequest request = new ForgotPasswordRequest();
                request.setEmail("bidder@acme.com");

                when(bidderAuthService.forgotPassword(any()))
                                .thenReturn("Password reset OTP has been sent to bidder@acme.com");

                authMockMvc.perform(post("/api/bidder/auth/forgot-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message", containsString("Password reset OTP")));
        }

        @Test
        @DisplayName("POST /forgot-password - 404 Not Found on unknown email")
        void testForgotPassword_NotFound() throws Exception {
                ForgotPasswordRequest request = new ForgotPasswordRequest();
                request.setEmail("unknown@acme.com");

                when(bidderAuthService.forgotPassword(any()))
                                .thenThrow(new BidderNotFoundException(
                                                "Error: No bidder account found with this email."));

                authMockMvc.perform(post("/api/bidder/auth/forgot-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.status").value(404))
                                .andExpect(jsonPath("$.error").value("Not Found"));
        }

        @Test
        @DisplayName("POST /verify-forgot-password-otp - 200 OK")
        void testVerifyForgotPasswordOtp_Success() throws Exception {
                VerifyForgotPasswordOtpRequest request = new VerifyForgotPasswordOtpRequest();
                request.setEmail("bidder@acme.com");
                request.setOtp("123456");

                when(bidderAuthService.verifyForgotPasswordOtp(any())).thenReturn("reset-token-abc");

                authMockMvc.perform(post("/api/bidder/auth/verify-forgot-password-otp")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.resetToken").value("reset-token-abc"));
        }

        @Test
        @DisplayName("POST /reset-password - 200 OK")
        void testResetPassword_Success() throws Exception {
                ResetPasswordRequest request = new ResetPasswordRequest();
                request.setResetToken("reset-token-abc");
                request.setNewPassword("NewPassword@123");

                when(bidderAuthService.resetPassword(any()))
                                .thenReturn("Password reset successfully. You can now login with your new password.");

                authMockMvc.perform(post("/api/bidder/auth/reset-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message", containsString("Password reset successfully")));
        }

        @Test
        @DisplayName("POST /reset-password - 400 Bad Request on invalid token")
        void testResetPassword_InvalidToken() throws Exception {
                ResetPasswordRequest request = new ResetPasswordRequest();
                request.setResetToken("bad-token");
                request.setNewPassword("NewPassword@123");

                when(bidderAuthService.resetPassword(any()))
                                .thenThrow(new InvalidTokenException("Error: Invalid reset token."));

                authMockMvc.perform(post("/api/bidder/auth/reset-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Invalid Token"));
        }

        // ==========================================
        // 8. Bidder Profile Management Endpoints
        // ==========================================
        @Test
        @DisplayName("GET /api/bidder - 200 OK returns list")
        void testGetAllBidders() throws Exception {
                BidderResponse b1 = new BidderResponse();
                b1.setId(1L);
                b1.setLegalName("ACME LTD");

                when(bidderService.getAllBidders()).thenReturn(List.of(b1));

                bidderMockMvc.perform(get("/api/bidder"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(1)))
                                .andExpect(jsonPath("$[0].id").value(1))
                                .andExpect(jsonPath("$[0].legalName").value("ACME LTD"));
        }

        @Test
        @DisplayName("GET /api/bidder/{id} - 200 OK")
        void testGetBidderById_Success() throws Exception {
                BidderResponse b1 = new BidderResponse();
                b1.setId(1L);
                b1.setLegalName("ACME LTD");

                when(bidderService.getBidderById(1L)).thenReturn(b1);

                bidderMockMvc.perform(get("/api/bidder/1"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(1))
                                .andExpect(jsonPath("$.legalName").value("ACME LTD"));
        }

        @Test
        @DisplayName("GET /api/bidder/{id} - 404 Not Found on BidderNotFoundException")
        void testGetBidderById_NotFound() throws Exception {
                when(bidderService.getBidderById(999L))
                                .thenThrow(new BidderNotFoundException("Bidder not found with id 999"));

                bidderMockMvc.perform(get("/api/bidder/999"))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.status").value(404))
                                .andExpect(jsonPath("$.error").value("Not Found"))
                                .andExpect(jsonPath("$.message").value("Bidder not found with id 999"));
        }

        @Test
        @DisplayName("GET /api/bidder/{id} - 400 Bad Request on type mismatch (string instead of Long)")
        void testGetBidderById_TypeMismatch() throws Exception {
                bidderMockMvc.perform(get("/api/bidder/not-a-number"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Invalid Parameter"))
                                .andExpect(jsonPath("$.message",
                                                containsString("Parameter 'id' must be of type Long")));
        }

        @Test
        @DisplayName("PUT /api/bidder/{id} - 200 OK")
        void testUpdateBidder_Success() throws Exception {
                UpdateBidderRequest updateRequest = new UpdateBidderRequest();
                updateRequest.setLegalName("ACME UPDATED LTD");

                BidderResponse response = new BidderResponse();
                response.setId(1L);
                response.setLegalName("ACME UPDATED LTD");

                when(bidderService.updateBidder(eq(1L), any())).thenReturn(response);

                bidderMockMvc.perform(put("/api/bidder/1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.legalName").value("ACME UPDATED LTD"));
        }

        @Test
        @DisplayName("PUT /api/bidder/{id} - 404 Not Found")
        void testUpdateBidder_NotFound() throws Exception {
                UpdateBidderRequest updateRequest = new UpdateBidderRequest();
                updateRequest.setLegalName("ACME UPDATED LTD");

                when(bidderService.updateBidder(eq(999L), any()))
                                .thenThrow(new BidderNotFoundException("Bidder not found"));

                bidderMockMvc.perform(put("/api/bidder/999")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest)))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.status").value(404))
                                .andExpect(jsonPath("$.error").value("Not Found"));
        }

        @Test
        @DisplayName("DELETE /api/bidder/{id} - 204 No Content on success")
        void testDeleteBidder_Success() throws Exception {
                doNothing().when(bidderService).deleteBidder(1L);

                bidderMockMvc.perform(delete("/api/bidder/1"))
                                .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("DELETE /api/bidder/{id} - 404 Not Found")
        void testDeleteBidder_NotFound() throws Exception {
                doThrow(new BidderNotFoundException("Bidder not found")).when(bidderService).deleteBidder(999L);

                bidderMockMvc.perform(delete("/api/bidder/999"))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.status").value(404));
        }

        // ==========================================
        // 9. Generic & Protocol Exceptions
        // ==========================================
        @Test
        @DisplayName("POST /signup - 400 Bad Request on malformed JSON body")
        void testMalformedJson() throws Exception {
                authMockMvc.perform(post("/api/bidder/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"legalName\": \"ACME\", invalid-json}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.status").value(400))
                                .andExpect(jsonPath("$.error").value("Malformed Request"));
        }

        @Test
        @DisplayName("POST /api/bidder - 405 Method Not Allowed")
        void testMethodNotSupported() throws Exception {
                bidderMockMvc.perform(post("/api/bidder"))
                                .andExpect(status().isMethodNotAllowed());
        }
}
