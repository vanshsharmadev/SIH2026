package com.example.Tender.bidder.service;

import com.example.Tender.bidder.dto.*;
import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.entity.BidderEmailOtp;
import com.example.Tender.bidder.entity.BidderTempRegistration;
import com.example.Tender.bidder.provider.MockBusinessVerificationProvider;
import com.example.Tender.bidder.repository.BidderEmailOtpRepository;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.repository.BidderTempRegistrationRepository;
import com.example.Tender.bidder.security.service.jwt.BidderJwtUtils;
import com.example.Tender.officer.service.BrevoEmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
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
    private PasswordEncoder passwordEncoder;

    @Mock
    private BidderJwtUtils bidderJwtUtils;

    @Mock
    private BrevoEmailService brevoEmailService;

    @Spy
    private MockBusinessVerificationProvider businessVerificationProvider = new MockBusinessVerificationProvider();

    @InjectMocks
    private BidderAuthService bidderAuthService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(bidderAuthService, "otpExpirationMinutes", 10);
    }

    @Test
    @DisplayName("1. Signup saves temporary registration and returns temp token")
    void testSignup_Success() {
        BidderSignupRequest request = BidderSignupRequest.builder()
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .password("Password@123")
                .phone("9876543210")
                .panNumber("ABCDE1234F")
                .gstNumber("27ABCDE1234F1Z5")
                .udyamNumber("UDYAM-MH-01-0123456")
                .build();

        when(bidderRepository.existsByEmail("bidder@acme.com")).thenReturn(false);
        when(bidderRepository.existsByPanNumber("ABCDE1234F")).thenReturn(false);
        when(bidderRepository.existsByGstNumber("27ABCDE1234F1Z5")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("hashedPassword");

        BidderInitiateResponse response = bidderAuthService.signup(request);

        assertNotNull(response);
        assertNotNull(response.getTempToken());
        assertEquals("bidder@acme.com", response.getEmail());
        assertEquals("ACME INFRASTRUCTURE LTD", response.getLegalName());
        assertEquals("ABCDE1234F", response.getPanNumber());
        assertEquals("27ABCDE1234F1Z5", response.getGstNumber());

        verify(tempRegistrationRepository).deleteByEmail("bidder@acme.com");
        verify(tempRegistrationRepository).save(any(BidderTempRegistration.class));
    }

    @Test
    @DisplayName("2. Signup rejects duplicate email")
    void testSignup_DuplicateEmail_ThrowsException() {
        BidderSignupRequest request = BidderSignupRequest.builder()
                .legalName("ACME LTD")
                .email("existing@acme.com")
                .password("Password@123")
                .panNumber("ABCDE1234F")
                .gstNumber("27ABCDE1234F1Z5")
                .build();

        when(bidderRepository.existsByEmail("existing@acme.com")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                bidderAuthService.signup(request)
        );

        assertTrue(ex.getMessage().contains("Email is already registered"));
    }

    @Test
    @DisplayName("3. Verify PAN succeeds with matching legal name")
    void testVerifyPan_Success() {
        BidderTempRegistration temp = BidderTempRegistration.builder()
                .tempToken("token123")
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .panNumber("ABCDE1234F")
                .gstNumber("27ABCDE1234F1Z5")
                .expiryTime(LocalDateTime.now().plusMinutes(20))
                .build();

        when(tempRegistrationRepository.findByTempToken("token123")).thenReturn(Optional.of(temp));

        BidderVerifyPanRequest request = BidderVerifyPanRequest.builder()
                .tempToken("token123")
                .build();

        BidderVerificationStatusResponse response = bidderAuthService.verifyPan(request);

        assertNotNull(response);
        assertTrue(response.isPanVerified());
        assertTrue(temp.isPanVerified());
        assertNotNull(temp.getPanVerifiedAt());
        verify(tempRegistrationRepository).save(temp);
    }

    @Test
    @DisplayName("4. Verify PAN throws exception if simulated failure or mismatch")
    void testVerifyPan_FailureSimulation_ThrowsException() {
        BidderTempRegistration temp = BidderTempRegistration.builder()
                .tempToken("token123")
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .panNumber("ABCDE1234F")
                .expiryTime(LocalDateTime.now().plusMinutes(20))
                .build();

        when(tempRegistrationRepository.findByTempToken("token123")).thenReturn(Optional.of(temp));

        BidderVerifyPanRequest request = BidderVerifyPanRequest.builder()
                .tempToken("token123")
                .simulateFailure(true)
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                bidderAuthService.verifyPan(request)
        );

        assertTrue(ex.getMessage().contains("PAN verification failed"));
    }

    @Test
    @DisplayName("5. Verify GSTIN succeeds and validates PAN consistency")
    void testVerifyGst_Success() {
        BidderTempRegistration temp = BidderTempRegistration.builder()
                .tempToken("token123")
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .panNumber("ABCDE1234F")
                .gstNumber("27ABCDE1234F1Z5")
                .expiryTime(LocalDateTime.now().plusMinutes(20))
                .build();

        when(tempRegistrationRepository.findByTempToken("token123")).thenReturn(Optional.of(temp));

        BidderVerifyGstRequest request = BidderVerifyGstRequest.builder()
                .tempToken("token123")
                .build();

        BidderVerificationStatusResponse response = bidderAuthService.verifyGst(request);

        assertNotNull(response);
        assertTrue(response.isGstVerified());
        assertTrue(temp.isGstVerified());
        verify(tempRegistrationRepository).save(temp);
    }

    @Test
    @DisplayName("6. Verify GSTIN fails if PAN does not match GSTIN embedded PAN")
    void testVerifyGst_PanInconsistent_ThrowsException() {
        BidderTempRegistration temp = BidderTempRegistration.builder()
                .tempToken("token123")
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .panNumber("XYZPQ9999Z") // Different PAN
                .gstNumber("27ABCDE1234F1Z5") // Contains ABCDE1234F
                .expiryTime(LocalDateTime.now().plusMinutes(20))
                .build();

        when(tempRegistrationRepository.findByTempToken("token123")).thenReturn(Optional.of(temp));

        BidderVerifyGstRequest request = BidderVerifyGstRequest.builder()
                .tempToken("token123")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                bidderAuthService.verifyGst(request)
        );

        assertTrue(ex.getMessage().contains("GSTIN verification failed"));
    }

    @Test
    @DisplayName("7. Verify Udyam succeeds for valid MSME registration")
    void testVerifyUdyam_Success() {
        BidderTempRegistration temp = BidderTempRegistration.builder()
                .tempToken("token123")
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .udyamNumber("UDYAM-MH-01-0123456")
                .expiryTime(LocalDateTime.now().plusMinutes(20))
                .build();

        when(tempRegistrationRepository.findByTempToken("token123")).thenReturn(Optional.of(temp));

        BidderVerifyUdyamRequest request = BidderVerifyUdyamRequest.builder()
                .tempToken("token123")
                .build();

        BidderVerificationStatusResponse response = bidderAuthService.verifyUdyam(request);

        assertNotNull(response);
        assertTrue(response.isUdyamVerified());
        assertTrue(temp.isUdyamVerified());
    }

    @Test
    @DisplayName("8. Unified business verification verifies all documents and triggers Brevo Email OTP")
    void testVerifyBusiness_Unified_AutoSendsOtp() {
        BidderTempRegistration temp = BidderTempRegistration.builder()
                .tempToken("token123")
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .panNumber("ABCDE1234F")
                .gstNumber("27ABCDE1234F1Z5")
                .udyamNumber("UDYAM-MH-01-0123456")
                .expiryTime(LocalDateTime.now().plusMinutes(20))
                .build();

        when(tempRegistrationRepository.findByTempToken("token123")).thenReturn(Optional.of(temp));
        when(brevoEmailService.sendOtpEmail(anyString(), anyString(), anyString(), anyInt())).thenReturn(true);

        BidderVerifyBusinessRequest request = BidderVerifyBusinessRequest.builder()
                .tempToken("token123")
                .build();

        BidderVerificationStatusResponse response = bidderAuthService.verifyBusiness(request);

        assertNotNull(response);
        assertTrue(response.isPanVerified());
        assertTrue(response.isGstVerified());
        assertTrue(response.isUdyamVerified());
        assertTrue(response.isAllBusinessVerified());

        verify(otpRepository).save(any(BidderEmailOtp.class));
        verify(brevoEmailService).sendOtpEmail(eq("bidder@acme.com"), eq("ACME INFRASTRUCTURE LTD"), anyString(), eq(10));
    }

    @Test
    @DisplayName("9. Verify OTP creates permanent Bidder and generates JWT token")
    void testVerifyOtp_Success() {
        String email = "bidder@acme.com";
        String otp = "654321";

        BidderTempRegistration temp = BidderTempRegistration.builder()
                .tempToken("token123")
                .legalName("ACME INFRASTRUCTURE LTD")
                .email(email)
                .password("hashedPassword")
                .phone("9876543210")
                .panNumber("ABCDE1234F")
                .gstNumber("27ABCDE1234F1Z5")
                .udyamNumber("UDYAM-MH-01-0123456")
                .panVerified(true)
                .gstVerified(true)
                .udyamVerified(true)
                .panVerifiedAt(LocalDateTime.now().minusMinutes(5))
                .gstVerifiedAt(LocalDateTime.now().minusMinutes(4))
                .udyamVerifiedAt(LocalDateTime.now().minusMinutes(3))
                .expiryTime(LocalDateTime.now().plusMinutes(20))
                .build();

        BidderEmailOtp activeOtp = BidderEmailOtp.builder()
                .email(email)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .verified(false)
                .build();

        Bidder savedBidder = Bidder.builder()
                .id(42L)
                .legalName("ACME INFRASTRUCTURE LTD")
                .email(email)
                .panNumber("ABCDE1234F")
                .gstNumber("27ABCDE1234F1Z5")
                .udyamNumber("UDYAM-MH-01-0123456")
                .isVerified(true)
                .build();

        when(bidderRepository.existsByEmail(email)).thenReturn(false);
        when(tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(temp));
        when(otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(email)).thenReturn(Optional.of(activeOtp));
        when(bidderRepository.save(any(Bidder.class))).thenReturn(savedBidder);
        when(bidderJwtUtils.generateJwtToken(any())).thenReturn("jwt.token.bidder");

        BidderVerifyOtpRequest request = BidderVerifyOtpRequest.builder()
                .email(email)
                .otp(otp)
                .build();

        BidderAuthResponse response = bidderAuthService.verifyOtp(request);

        assertNotNull(response);
        assertEquals("jwt.token.bidder", response.getToken());
        assertEquals(42L, response.getBidderId());
        assertEquals(email, response.getEmail());
        assertTrue(response.isVerified());

        verify(tempRegistrationRepository).delete(temp);
        verify(otpRepository).deleteByEmail(email);
    }

    @Test
    @DisplayName("10. Verify OTP rejects invalid OTP code")
    void testVerifyOtp_InvalidCode_ThrowsException() {
        String email = "bidder@acme.com";

        BidderTempRegistration temp = BidderTempRegistration.builder()
                .tempToken("token123")
                .legalName("ACME INFRASTRUCTURE LTD")
                .email(email)
                .panVerified(true)
                .gstVerified(true)
                .expiryTime(LocalDateTime.now().plusMinutes(20))
                .build();

        BidderEmailOtp activeOtp = BidderEmailOtp.builder()
                .email(email)
                .otp("111111")
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .verified(false)
                .build();

        when(bidderRepository.existsByEmail(email)).thenReturn(false);
        when(tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(temp));
        when(otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(email)).thenReturn(Optional.of(activeOtp));

        BidderVerifyOtpRequest request = BidderVerifyOtpRequest.builder()
                .email(email)
                .otp("999999")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                bidderAuthService.verifyOtp(request)
        );

        assertTrue(ex.getMessage().contains("Invalid OTP entered"));
        verify(bidderRepository, never()).save(any());
    }

    @Test
    @DisplayName("11. Login succeeds for verified bidder")
    void testLogin_Success() {
        Bidder bidder = Bidder.builder()
                .id(100L)
                .email("bidder@acme.com")
                .password("encodedPassword")
                .legalName("ACME INFRASTRUCTURE LTD")
                .isVerified(true)
                .build();

        when(bidderRepository.findByEmail("bidder@acme.com")).thenReturn(Optional.of(bidder));
        when(passwordEncoder.matches("Password@123", "encodedPassword")).thenReturn(true);
        when(bidderJwtUtils.generateJwtToken(any())).thenReturn("jwt.login.token");

        BidderLoginRequest request = new BidderLoginRequest();
        request.setEmail("bidder@acme.com");
        request.setPassword("Password@123");

        BidderAuthResponse response = bidderAuthService.login(request);

        assertNotNull(response);
        assertEquals("jwt.login.token", response.getToken());
        assertEquals(100L, response.getBidderId());
        assertEquals("ACME INFRASTRUCTURE LTD", response.getLegalName());
    }

    @Test
    @DisplayName("12. Login rejects unverified account")
    void testLogin_Unverified_ThrowsException() {
        Bidder bidder = Bidder.builder()
                .id(100L)
                .email("bidder@acme.com")
                .password("encodedPassword")
                .legalName("ACME INFRASTRUCTURE LTD")
                .isVerified(false)
                .build();

        when(bidderRepository.findByEmail("bidder@acme.com")).thenReturn(Optional.of(bidder));
        when(passwordEncoder.matches("Password@123", "encodedPassword")).thenReturn(true);

        BidderLoginRequest request = new BidderLoginRequest();
        request.setEmail("bidder@acme.com");
        request.setPassword("Password@123");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                bidderAuthService.login(request)
        );

        assertTrue(ex.getMessage().contains("Account is not verified"));
    }
}
