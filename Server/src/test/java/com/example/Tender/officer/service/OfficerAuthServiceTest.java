package com.example.Tender.officer.service;

import com.example.Tender.officer.dto.*;
import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.model.OfficerEmailOtp;
import com.example.Tender.officer.model.OfficerRole;
import com.example.Tender.officer.model.OfficerTempRegistration;
import com.example.Tender.officer.model.OfficerVerificationStatus;
import com.example.Tender.officer.provider.DigiLockerProvider;
import com.example.Tender.officer.repository.OfficerEmailOtpRepository;
import com.example.Tender.officer.repository.OfficerRepository;
import com.example.Tender.officer.repository.OfficerTempRegistrationRepository;
import com.example.Tender.officer.security.jwt.OfficerJwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OfficerAuthServiceTest {

    @Mock
    private OfficerRepository officerRepository;

    @Mock
    private OfficerTempRegistrationRepository tempRegistrationRepository;

    @Mock
    private OfficerEmailOtpRepository otpRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private OfficerJwtUtils officerJwtUtils;

    @Mock
    private BrevoEmailService brevoEmailService;

    @Mock
    private DigiLockerProvider digiLockerProvider;

    @InjectMocks
    private OfficerAuthService officerAuthService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(officerAuthService, "otpExpirationMinutes", 10);
    }

    @Test
    @DisplayName("TEST 1: Signup -> Mock DigiLocker success -> OTP automatically sent")
    void test1_mockDigiLockerSuccess_automaticallySendsOtp() {
        String token = "temp-token-123";
        OfficerTempRegistration temp = OfficerTempRegistration.builder()
                .id(1L)
                .name("Arnav Tyagi")
                .email("arnav@example.com")
                .mobile("9876543210")
                .password("hashed_pwd")
                .tempToken(token)
                .identityVerified(false)
                .expiryTime(LocalDateTime.now().plusMinutes(30))
                .build();

        when(tempRegistrationRepository.findByTempToken(token)).thenReturn(Optional.of(temp));
        when(digiLockerProvider.fetchIdentity(eq(token), any())).thenReturn(
                new DigiLockerProvider.DigiLockerIdentity(
                        "DL-DEMO-001",
                        "Arnav Tyagi",
                        LocalDate.of(2003, 5, 15),
                        "M",
                        "DIGILOCKER_MOCK",
                        "VERIFIED",
                        LocalDateTime.now()
                )
        );

        OfficerMockVerifyRequest request = OfficerMockVerifyRequest.builder()
                .tempToken(token)
                .build();

        OfficerIdentityResponse response = officerAuthService.verifyMockIdentity(request);

        assertTrue(response.getIdentityVerified());
        assertEquals("DL-DEMO-001", response.getDigilockerId());
        assertEquals("Arnav Tyagi", response.getVerifiedName());

        // Verify temp registration is marked verified and saved
        verify(tempRegistrationRepository).save(argThat(OfficerTempRegistration::isIdentityVerified));

        // Verify OTP is created and saved
        ArgumentCaptor<OfficerEmailOtp> otpCaptor = ArgumentCaptor.forClass(OfficerEmailOtp.class);
        verify(otpRepository).save(otpCaptor.capture());
        OfficerEmailOtp savedOtp = otpCaptor.getValue();
        assertEquals("arnav@example.com", savedOtp.getEmail());
        assertNotNull(savedOtp.getOtp());
        assertEquals(6, savedOtp.getOtp().length());
        assertFalse(savedOtp.isVerified());

        // Verify Brevo email service was invoked
        verify(brevoEmailService).sendOtpEmail(eq("arnav@example.com"), eq("Arnav Tyagi"), eq(savedOtp.getOtp()), eq(10));
    }

    @Test
    @DisplayName("TEST 2: Signup -> DigiLocker name mismatch -> NO OTP sent, identityVerified=false")
    void test2_digiLockerNameMismatch_noOtpSent() {
        String token = "temp-token-123";
        OfficerTempRegistration temp = OfficerTempRegistration.builder()
                .id(1L)
                .name("Arnav Tyagi")
                .email("arnav@example.com")
                .mobile("9876543210")
                .password("hashed_pwd")
                .tempToken(token)
                .identityVerified(false)
                .expiryTime(LocalDateTime.now().plusMinutes(30))
                .build();

        when(tempRegistrationRepository.findByTempToken(token)).thenReturn(Optional.of(temp));
        when(digiLockerProvider.fetchIdentity(eq(token), any())).thenReturn(
                new DigiLockerProvider.DigiLockerIdentity(
                        "DL-DEMO-002",
                        "Different Person",
                        LocalDate.of(1990, 1, 1),
                        "M",
                        "DIGILOCKER_MOCK",
                        "VERIFIED",
                        LocalDateTime.now()
                )
        );

        OfficerMockVerifyRequest request = OfficerMockVerifyRequest.builder()
                .tempToken(token)
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> officerAuthService.verifyMockIdentity(request));

        assertTrue(ex.getMessage().contains("Identity verification failed"));
        assertFalse(temp.isIdentityVerified());

        // NO OTP generated or sent
        verify(otpRepository, never()).save(any());
        verify(brevoEmailService, never()).sendOtpEmail(any(), any(), any(), anyInt());
        verify(officerRepository, never()).save(any());
    }

    @Test
    @DisplayName("TEST 3: Signup -> DigiLocker failure -> verification fails, NO OTP sent")
    void test3_digiLockerFailure_noOtpSent() {
        String token = "temp-token-123";
        OfficerTempRegistration temp = OfficerTempRegistration.builder()
                .id(1L)
                .name("Arnav Tyagi")
                .email("arnav@example.com")
                .mobile("9876543210")
                .password("hashed_pwd")
                .tempToken(token)
                .identityVerified(false)
                .expiryTime(LocalDateTime.now().plusMinutes(30))
                .build();

        when(tempRegistrationRepository.findByTempToken(token)).thenReturn(Optional.of(temp));

        OfficerMockVerifyRequest request = OfficerMockVerifyRequest.builder()
                .tempToken(token)
                .simulateFailure(true)
                .build();

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> officerAuthService.verifyMockIdentity(request));

        assertTrue(ex.getMessage().contains("DigiLocker identity verification failed"));

        // NO OTP generated or sent
        verify(otpRepository, never()).save(any());
        verify(brevoEmailService, never()).sendOtpEmail(any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("TEST 4: Correct OTP -> Officer created, role=ROLE_OFFICER, verificationStatus=VERIFIED, clean up done, JWT returned")
    void test4_correctOtp_createsOfficerAndReturnsJwt() {
        String email = "arnav@example.com";
        String otp = "123456";

        when(officerRepository.existsByEmail(email)).thenReturn(false);

        OfficerTempRegistration temp = OfficerTempRegistration.builder()
                .id(1L)
                .name("Arnav Tyagi")
                .email(email)
                .mobile("9876543210")
                .password("hashed_pwd")
                .tempToken("token-123")
                .identityVerified(true)
                .digilockerId("DL-DEMO-001")
                .identityProvider("DIGILOCKER_MOCK")
                .identityVerifiedAt(LocalDateTime.now().minusMinutes(2))
                .expiryTime(LocalDateTime.now().plusMinutes(28))
                .build();
        when(tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(temp));

        OfficerEmailOtp activeOtp = OfficerEmailOtp.builder()
                .id(10L)
                .email(email)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(8))
                .verified(false)
                .build();
        when(otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(email)).thenReturn(Optional.of(activeOtp));

        Officer savedOfficer = Officer.builder()
                .id(100L)
                .name("Arnav Tyagi")
                .email(email)
                .mobile("9876543210")
                .password("hashed_pwd")
                .role(OfficerRole.ROLE_OFFICER)
                .verificationStatus(OfficerVerificationStatus.VERIFIED)
                .digilockerId("DL-DEMO-001")
                .identityProvider("DIGILOCKER_MOCK")
                .identityVerifiedAt(temp.getIdentityVerifiedAt())
                .build();
        when(officerRepository.save(any(Officer.class))).thenReturn(savedOfficer);
        when(officerJwtUtils.generateTokenFromUsername(email)).thenReturn("mocked.jwt.token");

        OfficerVerifyOtpRequest request = OfficerVerifyOtpRequest.builder()
                .email(email)
                .otp(otp)
                .build();

        OfficerAuthResponse response = officerAuthService.verifyOtp(request);

        assertNotNull(response);
        assertEquals("mocked.jwt.token", response.getToken());
        assertEquals(100L, response.getId());
        assertEquals(OfficerRole.ROLE_OFFICER, response.getRole());
        assertEquals(OfficerVerificationStatus.VERIFIED, response.getVerificationStatus());
        assertEquals("Arnav Tyagi", response.getName());
        assertEquals(email, response.getEmail());

        // Verify cleanup
        verify(tempRegistrationRepository).delete(temp);
        verify(otpRepository).deleteByEmail(email);
    }

    @Test
    @DisplayName("TEST 5: Wrong OTP -> Officer NOT created, TempRegistration remains, OTP remains unverified, NO JWT")
    void test5_wrongOtp_rejected() {
        String email = "arnav@example.com";

        when(officerRepository.existsByEmail(email)).thenReturn(false);

        OfficerTempRegistration temp = OfficerTempRegistration.builder()
                .id(1L)
                .name("Arnav Tyagi")
                .email(email)
                .identityVerified(true)
                .expiryTime(LocalDateTime.now().plusMinutes(25))
                .build();
        when(tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(temp));

        OfficerEmailOtp activeOtp = OfficerEmailOtp.builder()
                .id(10L)
                .email(email)
                .otp("123456")
                .expiryTime(LocalDateTime.now().plusMinutes(8))
                .verified(false)
                .build();
        when(otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(email)).thenReturn(Optional.of(activeOtp));

        OfficerVerifyOtpRequest request = OfficerVerifyOtpRequest.builder()
                .email(email)
                .otp("999999") // Wrong OTP
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> officerAuthService.verifyOtp(request));

        assertEquals("Error: Invalid OTP entered!", ex.getMessage());

        // Verify officer is NOT created and records are NOT cleaned up
        verify(officerRepository, never()).save(any());
        verify(tempRegistrationRepository, never()).delete(any());
        verify(otpRepository, never()).deleteByEmail(any());
        verify(officerJwtUtils, never()).generateTokenFromUsername(any());
    }

    @Test
    @DisplayName("TEST 6: Expired OTP -> Officer NOT created, NO JWT returned")
    void test6_expiredOtp_rejected() {
        String email = "arnav@example.com";

        when(officerRepository.existsByEmail(email)).thenReturn(false);

        OfficerTempRegistration temp = OfficerTempRegistration.builder()
                .id(1L)
                .name("Arnav Tyagi")
                .email(email)
                .identityVerified(true)
                .expiryTime(LocalDateTime.now().plusMinutes(25))
                .build();
        when(tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(temp));

        OfficerEmailOtp expiredOtp = OfficerEmailOtp.builder()
                .id(10L)
                .email(email)
                .otp("123456")
                .expiryTime(LocalDateTime.now().minusMinutes(1)) // Expired
                .verified(false)
                .build();
        when(otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(email)).thenReturn(Optional.of(expiredOtp));

        OfficerVerifyOtpRequest request = OfficerVerifyOtpRequest.builder()
                .email(email)
                .otp("123456")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> officerAuthService.verifyOtp(request));

        assertEquals("Error: OTP has expired. Please request a new OTP.", ex.getMessage());
        verify(officerRepository, never()).save(any());
        verify(officerJwtUtils, never()).generateTokenFromUsername(any());
    }

    @Test
    @DisplayName("TEST 7: DigiLocker not verified -> verifyOtp -> request rejected, NO Officer created, NO JWT")
    void test7_digilockerNotVerified_verifyOtpRejected() {
        String email = "arnav@example.com";

        when(officerRepository.existsByEmail(email)).thenReturn(false);

        OfficerTempRegistration temp = OfficerTempRegistration.builder()
                .id(1L)
                .name("Arnav Tyagi")
                .email(email)
                .identityVerified(false) // Not verified yet
                .expiryTime(LocalDateTime.now().plusMinutes(25))
                .build();
        when(tempRegistrationRepository.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(temp));

        OfficerVerifyOtpRequest request = OfficerVerifyOtpRequest.builder()
                .email(email)
                .otp("123456")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> officerAuthService.verifyOtp(request));

        assertTrue(ex.getMessage().contains("DigiLocker identity verification must be completed"));
        verify(officerRepository, never()).save(any());
        verify(officerJwtUtils, never()).generateTokenFromUsername(any());
    }

    @Test
    @DisplayName("TEST 8: Existing email -> verifyOtp with any OTP -> request rejected, NO JWT returned")
    void test8_existingEmail_verifyOtpRejectedWithoutJwt() {
        String email = "existing.officer@example.com";

        // Email already registered in permanent OfficerRepository
        when(officerRepository.existsByEmail(email)).thenReturn(true);

        OfficerVerifyOtpRequest request = OfficerVerifyOtpRequest.builder()
                .email(email)
                .otp("123456")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> officerAuthService.verifyOtp(request));

        assertEquals("Error: Email is already registered.", ex.getMessage());

        // Critical: Ensure no JWT is generated and no officer is created or bypassed
        verify(officerJwtUtils, never()).generateTokenFromUsername(any());
        verify(officerRepository, never()).save(any());
        verify(tempRegistrationRepository, never()).findTopByEmailOrderByCreatedAtDesc(any());
    }

    @Test
    @DisplayName("TEST 9: Already verified temp registration -> DigiLocker verification cannot be repeated, NO second OTP generated")
    void test9_alreadyVerifiedTempRegistration_cannotBeRepeated() {
        String token = "temp-token-123";
        OfficerTempRegistration temp = OfficerTempRegistration.builder()
                .id(1L)
                .name("Arnav Tyagi")
                .email("arnav@example.com")
                .tempToken(token)
                .identityVerified(true) // Already verified
                .expiryTime(LocalDateTime.now().plusMinutes(20))
                .build();

        when(tempRegistrationRepository.findByTempToken(token)).thenReturn(Optional.of(temp));

        OfficerMockVerifyRequest request = OfficerMockVerifyRequest.builder()
                .tempToken(token)
                .build();

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> officerAuthService.verifyMockIdentity(request));

        assertTrue(ex.getMessage().contains("Identity for this registration has already been verified"));

        // No second OTP generated or sent
        verify(otpRepository, never()).save(any());
        verify(brevoEmailService, never()).sendOtpEmail(any(), any(), any(), anyInt());
    }
}
