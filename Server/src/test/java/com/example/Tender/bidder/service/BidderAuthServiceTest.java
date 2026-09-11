package com.example.Tender.bidder.service;

import com.example.Tender.bidder.dto.*;
import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.entity.BidderEmailOtp;
import com.example.Tender.bidder.entity.BidderTempRegistration;
import com.example.Tender.bidder.entity.BidderVerification;
import com.example.Tender.bidder.provider.MockBusinessVerificationProvider;
import com.example.Tender.bidder.repository.BidderEmailOtpRepository;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.repository.BidderTempRegistrationRepository;
import com.example.Tender.bidder.repository.BidderVerificationRepository;
import com.example.Tender.bidder.security.service.jwt.BidderJwtUtils;
import com.example.Tender.officer.service.BrevoEmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BidderAuthServiceTest {

    @Mock
    private BidderRepository bidderRepository;

    @Mock
    private BidderTempRegistrationRepository tempRegistrationRepository;

    @Mock
    private BidderEmailOtpRepository otpRepository;

    @Mock
    private BidderVerificationRepository bidderVerificationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private BidderJwtUtils bidderJwtUtils;

    @Mock
    private BrevoEmailService brevoEmailService;

    @Mock
    private MockBusinessVerificationProvider businessVerificationProvider;

    @InjectMocks
    private BidderAuthService bidderAuthService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(bidderAuthService, "otpExpirationMinutes", 10);
        lenient().when(brevoEmailService.sendBidderOtpEmail(any(), any(), any(), anyInt())).thenReturn(true);
    }

    @Test
    @DisplayName("1. Signup verifies against bidder_verification and dispatches OTP")
    void testSignup_Success() {
        BidderSignupRequest request = BidderSignupRequest.builder()
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .password("Password@123")
                .phone("9876543210")
                .gstNumber("27ABCDE1234F1Z5")
                .build();

        BidderVerification verifiedRecord = BidderVerification.builder()
                .id(1L)
                .name("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .gstNumber("27ABCDE1234F1Z5")
                .build();

        when(bidderVerificationRepository.findByNameAndEmailAndGstNumberIgnoreCase(
                "ACME INFRASTRUCTURE LTD",
                "bidder@acme.com",
                "27ABCDE1234F1Z5"
        )).thenReturn(Optional.of(verifiedRecord));

        when(bidderRepository.existsByEmail("bidder@acme.com")).thenReturn(false);
        when(bidderRepository.existsByGstNumber("27ABCDE1234F1Z5")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("hashedPassword");

        BidderInitiateResponse response = bidderAuthService.signup(request);

        assertNotNull(response);
        assertNotNull(response.getTempToken());
        assertEquals("bidder@acme.com", response.getEmail());
        assertEquals("ACME INFRASTRUCTURE LTD", response.getLegalName());
        assertEquals("27ABCDE1234F1Z5", response.getGstNumber());

        verify(tempRegistrationRepository).deleteByEmail("bidder@acme.com");
        verify(tempRegistrationRepository).save(any(BidderTempRegistration.class));
        verify(otpRepository).save(any(BidderEmailOtp.class));
    }

    @Test
    @DisplayName("2. Signup rejects unverified credentials")
    void testSignup_Unverified_ThrowsException() {
        BidderSignupRequest request = BidderSignupRequest.builder()
                .legalName("UNKNOWN LTD")
                .email("unknown@acme.com")
                .password("Password@123")
                .gstNumber("99UNKNOWN1234F1")
                .build();

        when(bidderVerificationRepository.findByNameAndEmailAndGstNumberIgnoreCase(anyString(), anyString(), anyString()))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> bidderAuthService.signup(request));
        assertTrue(ex.getMessage().contains("Invalid credentials"));
    }

    @Test
    @DisplayName("3. Verify OTP creates permanent bidder")
    void testVerifyOtp_Success() {
        BidderVerifyOtpRequest request = new BidderVerifyOtpRequest("bidder@acme.com", "123456");

        BidderTempRegistration temp = BidderTempRegistration.builder()
                .id(1L)
                .tempToken("token123")
                .legalName("ACME LTD")
                .email("bidder@acme.com")
                .password("hashedPassword")
                .gstNumber("27ABCDE1234F1Z5")
                .gstVerified(true)
                .panVerified(true)
                .expiryTime(LocalDateTime.now().plusMinutes(10))
                .build();

        BidderEmailOtp activeOtp = BidderEmailOtp.builder()
                .id(1L)
                .email("bidder@acme.com")
                .otp("123456")
                .verified(false)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .build();

        when(bidderRepository.existsByEmail("bidder@acme.com")).thenReturn(false);
        when(tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc("bidder@acme.com")).thenReturn(Optional.of(temp));
        when(otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc("bidder@acme.com")).thenReturn(Optional.of(activeOtp));
        when(bidderRepository.save(any(Bidder.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bidderJwtUtils.generateJwtToken(any())).thenReturn("mockJwtToken");

        BidderAuthResponse response = bidderAuthService.verifyOtp(request);

        assertNotNull(response);
        assertEquals("mockJwtToken", response.getToken());
        assertEquals("bidder@acme.com", response.getEmail());

        verify(tempRegistrationRepository).delete(temp);
        verify(otpRepository).deleteByEmail("bidder@acme.com");
    }

    @Test
    @DisplayName("4. Signup fails with IllegalStateException when email service fails to send OTP")
    void testSignup_OtpDeliveryFailure_ThrowsIllegalStateException() {
        BidderSignupRequest request = BidderSignupRequest.builder()
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .password("Password@123")
                .phone("9876543210")
                .gstNumber("27ABCDE1234F1Z5")
                .build();

        BidderVerification verifiedRecord = BidderVerification.builder()
                .id(1L)
                .name("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .gstNumber("27ABCDE1234F1Z5")
                .build();

        when(bidderVerificationRepository.findByNameAndEmailAndGstNumberIgnoreCase(
                "ACME INFRASTRUCTURE LTD",
                "bidder@acme.com",
                "27ABCDE1234F1Z5"
        )).thenReturn(Optional.of(verifiedRecord));

        when(bidderRepository.existsByEmail("bidder@acme.com")).thenReturn(false);
        when(bidderRepository.existsByGstNumber("27ABCDE1234F1Z5")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("hashedPassword");
        when(brevoEmailService.sendBidderOtpEmail(eq("bidder@acme.com"), eq("ACME INFRASTRUCTURE LTD"), anyString(), anyInt()))
                .thenReturn(false);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                bidderAuthService.signup(request)
        );

        assertTrue(ex.getMessage().contains("Failed to deliver OTP verification email"));
    }
}
