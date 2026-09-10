package com.example.Tender.auth.service;

import com.example.Tender.auth.dto.AuthUserDto;
import com.example.Tender.auth.dto.LoginRequest;
import com.example.Tender.auth.dto.LoginResponse;
import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.exception.BidderNotVerifiedException;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.security.BidderPrincipal;
import com.example.Tender.bidder.security.service.jwt.BidderJwtUtils;
import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.model.OfficerRole;
import com.example.Tender.officer.model.OfficerVerificationStatus;
import com.example.Tender.officer.repository.OfficerRepository;
import com.example.Tender.officer.security.jwt.OfficerJwtUtils;
import com.example.Tender.officer.security.service.OfficerPrincipal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommonAuthServiceTest {

    @Mock
    private OfficerRepository officerRepository;

    @Mock
    private BidderRepository bidderRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OfficerJwtUtils officerJwtUtils;

    @Mock
    private BidderJwtUtils bidderJwtUtils;

    @InjectMocks
    private CommonAuthService commonAuthService;

    @Test
    @DisplayName("Unified Login: Officer credentials successfully authenticate and return OFFICER role")
    void testLogin_OfficerSuccess() {
        LoginRequest request = LoginRequest.builder()
                .email("officer@gem.gov.in")
                .password("Secret@123")
                .build();

        Officer officer = Officer.builder()
                .id(101L)
                .name("Vikram Sharma")
                .email("officer@gem.gov.in")
                .password("hashed_pwd")
                .role(OfficerRole.ROLE_OFFICER)
                .verificationStatus(OfficerVerificationStatus.VERIFIED)
                .build();

        when(officerRepository.findByEmail("officer@gem.gov.in")).thenReturn(Optional.of(officer));
        when(passwordEncoder.matches("Secret@123", "hashed_pwd")).thenReturn(true);
        when(officerJwtUtils.generateTokenWithClaims(eq("officer@gem.gov.in"), eq(101L), eq("OFFICER"), eq("Vikram Sharma")))
                .thenReturn("mock_officer_jwt");

        LoginResponse response = commonAuthService.login(request);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("Login successful", response.getMessage());
        assertEquals("mock_officer_jwt", response.getToken());
        assertNotNull(response.getUser());
        assertEquals(101L, response.getUser().getId());
        assertEquals("Vikram Sharma", response.getUser().getName());
        assertEquals("officer@gem.gov.in", response.getUser().getEmail());
        assertEquals("OFFICER", response.getUser().getRole());

        // Bidder repository should not be queried if Officer succeeds
        verify(bidderRepository, never()).findByEmail(anyString());
    }

    @Test
    @DisplayName("Unified Login: Bidder credentials successfully authenticate and return BIDDER role")
    void testLogin_BidderSuccess() {
        LoginRequest request = LoginRequest.builder()
                .email("bidder@acme.com")
                .password("Password@123")
                .build();

        Bidder bidder = Bidder.builder()
                .id(202L)
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .password("hashed_bidder_pwd")
                .role("BIDDER")
                .isVerified(true)
                .build();

        when(officerRepository.findByEmail("bidder@acme.com")).thenReturn(Optional.empty());
        when(bidderRepository.findByEmail("bidder@acme.com")).thenReturn(Optional.of(bidder));
        when(passwordEncoder.matches("Password@123", "hashed_bidder_pwd")).thenReturn(true);
        when(bidderJwtUtils.generateTokenWithClaims(eq("bidder@acme.com"), eq(202L), eq("BIDDER"), eq("ACME INFRASTRUCTURE LTD")))
                .thenReturn("mock_bidder_jwt");

        LoginResponse response = commonAuthService.login(request);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("Login successful", response.getMessage());
        assertEquals("mock_bidder_jwt", response.getToken());
        assertNotNull(response.getUser());
        assertEquals(202L, response.getUser().getId());
        assertEquals("ACME INFRASTRUCTURE LTD", response.getUser().getName());
        assertEquals("bidder@acme.com", response.getUser().getEmail());
        assertEquals("BIDDER", response.getUser().getRole());
    }

    @Test
    @DisplayName("Unified Login: Invalid password for existing bidder throws BadCredentialsException")
    void testLogin_InvalidPassword_ThrowsBadCredentials() {
        LoginRequest request = LoginRequest.builder()
                .email("bidder@acme.com")
                .password("WrongPassword")
                .build();

        Bidder bidder = Bidder.builder()
                .id(202L)
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .password("hashed_bidder_pwd")
                .isVerified(true)
                .build();

        when(officerRepository.findByEmail("bidder@acme.com")).thenReturn(Optional.empty());
        when(bidderRepository.findByEmail("bidder@acme.com")).thenReturn(Optional.of(bidder));
        when(passwordEncoder.matches("WrongPassword", "hashed_bidder_pwd")).thenReturn(false);

        BadCredentialsException exception = assertThrows(BadCredentialsException.class, () ->
                commonAuthService.login(request)
        );

        assertEquals("Invalid email or password", exception.getMessage());
    }

    @Test
    @DisplayName("Unified Login: Non-existent email throws BadCredentialsException")
    void testLogin_UserNotFound_ThrowsBadCredentials() {
        LoginRequest request = LoginRequest.builder()
                .email("unknown@nowhere.com")
                .password("AnyPassword")
                .build();

        when(officerRepository.findByEmail("unknown@nowhere.com")).thenReturn(Optional.empty());
        when(bidderRepository.findByEmail("unknown@nowhere.com")).thenReturn(Optional.empty());

        BadCredentialsException exception = assertThrows(BadCredentialsException.class, () ->
                commonAuthService.login(request)
        );

        assertEquals("Invalid email or password", exception.getMessage());
    }

    @Test
    @DisplayName("Unified Login: Unverified bidder throws BidderNotVerifiedException")
    void testLogin_UnverifiedBidder_ThrowsBidderNotVerifiedException() {
        LoginRequest request = LoginRequest.builder()
                .email("unverified@acme.com")
                .password("Password@123")
                .build();

        Bidder bidder = Bidder.builder()
                .id(303L)
                .legalName("Unverified Co")
                .email("unverified@acme.com")
                .password("hashed_pwd")
                .isVerified(false)
                .build();

        when(officerRepository.findByEmail("unverified@acme.com")).thenReturn(Optional.empty());
        when(bidderRepository.findByEmail("unverified@acme.com")).thenReturn(Optional.of(bidder));
        when(passwordEncoder.matches("Password@123", "hashed_pwd")).thenReturn(true);

        assertThrows(BidderNotVerifiedException.class, () ->
                commonAuthService.login(request)
        );
    }

    @Test
    @DisplayName("Unified Login: Rejected officer throws IllegalArgumentException")
    void testLogin_RejectedOfficer_ThrowsIllegalArgumentException() {
        LoginRequest request = LoginRequest.builder()
                .email("rejected@gem.gov.in")
                .password("Password@123")
                .build();

        Officer officer = Officer.builder()
                .id(404L)
                .name("Rejected Officer")
                .email("rejected@gem.gov.in")
                .password("hashed_pwd")
                .role(OfficerRole.ROLE_OFFICER)
                .verificationStatus(OfficerVerificationStatus.REJECTED)
                .build();

        when(officerRepository.findByEmail("rejected@gem.gov.in")).thenReturn(Optional.of(officer));
        when(passwordEncoder.matches("Password@123", "hashed_pwd")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                commonAuthService.login(request)
        );

        assertTrue(exception.getMessage().contains("rejected"));
    }

    @Test
    @DisplayName("Profile Resolution: OfficerPrincipal resolves to OFFICER AuthUserDto")
    void testGetCurrentUserProfile_OfficerPrincipal() {
        Officer officer = Officer.builder()
                .id(101L)
                .name("Vikram Sharma")
                .email("officer@gem.gov.in")
                .role(OfficerRole.ROLE_OFFICER)
                .verificationStatus(OfficerVerificationStatus.VERIFIED)
                .build();
        OfficerPrincipal principal = OfficerPrincipal.build(officer);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        AuthUserDto profile = commonAuthService.getCurrentUserProfile(authentication);

        assertNotNull(profile);
        assertEquals(101L, profile.getId());
        assertEquals("Vikram Sharma", profile.getName());
        assertEquals("officer@gem.gov.in", profile.getEmail());
        assertEquals("OFFICER", profile.getRole());
    }

    @Test
    @DisplayName("Profile Resolution: BidderPrincipal resolves to BIDDER AuthUserDto")
    void testGetCurrentUserProfile_BidderPrincipal() {
        Bidder bidder = Bidder.builder()
                .id(202L)
                .legalName("ACME INFRASTRUCTURE LTD")
                .email("bidder@acme.com")
                .build();
        BidderPrincipal principal = new BidderPrincipal(bidder);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        AuthUserDto profile = commonAuthService.getCurrentUserProfile(authentication);

        assertNotNull(profile);
        assertEquals(202L, profile.getId());
        assertEquals("ACME INFRASTRUCTURE LTD", profile.getName());
        assertEquals("bidder@acme.com", profile.getEmail());
        assertEquals("BIDDER", profile.getRole());
    }

    @Test
    @DisplayName("Profile Resolution: Unauthenticated returns null")
    void testGetCurrentUserProfile_NullAuthentication() {
        assertNull(commonAuthService.getCurrentUserProfile(null));
    }
}
