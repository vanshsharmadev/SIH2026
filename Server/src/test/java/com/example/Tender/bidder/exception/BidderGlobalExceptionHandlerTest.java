package com.example.Tender.bidder.exception;

import com.example.Tender.bidder.dto.BidderErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BidderGlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @Mock
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        when(request.getRequestURI()).thenReturn("/api/bidder/auth/test");
    }

    @Test
    @DisplayName("Handle MethodArgumentNotValidException returns 400 with validation errors")
    void testHandleValidationExceptions() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError1 = new FieldError("signupRequest", "email", "must be a well-formed email address");
        FieldError fieldError2 = new FieldError("signupRequest", "password", "must not be blank");
        when(bindingResult.getAllErrors()).thenReturn(List.of(fieldError1, fieldError2));

        MethodParameter parameter = mock(MethodParameter.class);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleValidationExceptions(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Validation Failed", response.getBody().getError());
        assertEquals(2, response.getBody().getValidationErrors().size());
        assertEquals("must be a well-formed email address", response.getBody().getValidationErrors().get("email"));
        assertEquals("must not be blank", response.getBody().getValidationErrors().get("password"));
        assertEquals("/api/bidder/auth/test", response.getBody().getPath());
    }

    @Test
    @DisplayName("Handle BidderNotFoundException returns 404")
    void testHandleBidderNotFound() {
        BidderNotFoundException ex = new BidderNotFoundException("Bidder not found with id 123");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleBidderNotFound(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getStatus());
        assertEquals("Not Found", response.getBody().getError());
        assertEquals("Bidder not found with id 123", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Handle BidderAlreadyExistsException returns 409 Conflict")
    void testHandleBidderAlreadyExists() {
        BidderAlreadyExistsException ex = new BidderAlreadyExistsException("Error: Email is already registered!");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleBidderAlreadyExists(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(409, response.getBody().getStatus());
        assertEquals("Conflict", response.getBody().getError());
        assertEquals("Error: Email is already registered!", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Handle BidderVerificationException returns 400")
    void testHandleBidderVerification() {
        BidderVerificationException ex = new BidderVerificationException("PAN verification failed: Invalid PAN format");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleBidderVerification(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Verification Failed", response.getBody().getError());
        assertEquals("PAN verification failed: Invalid PAN format", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Handle InvalidOtpException returns 400")
    void testHandleInvalidOtp() {
        InvalidOtpException ex = new InvalidOtpException("Error: Invalid OTP entered!");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleInvalidOtp(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Invalid OTP", response.getBody().getError());
    }

    @Test
    @DisplayName("Handle OtpExpiredException returns 400")
    void testHandleOtpExpired() {
        OtpExpiredException ex = new OtpExpiredException("Error: OTP has expired. Please request a new OTP.");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleOtpExpired(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("OTP Expired", response.getBody().getError());
    }

    @Test
    @DisplayName("Handle InvalidTokenException returns 400")
    void testHandleInvalidToken() {
        InvalidTokenException ex = new InvalidTokenException("Error: Invalid or expired temporary token.");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleInvalidToken(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Invalid Token", response.getBody().getError());
    }

    @Test
    @DisplayName("Handle BidderNotVerifiedException returns 403 Forbidden")
    void testHandleBidderNotVerified() {
        BidderNotVerifiedException ex = new BidderNotVerifiedException("Account is not verified. Please complete verification.");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleBidderNotVerified(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(403, response.getBody().getStatus());
        assertEquals("Forbidden", response.getBody().getError());
    }

    @Test
    @DisplayName("Handle BadCredentialsException returns 401 Unauthorized")
    void testHandleBadCredentials() {
        BadCredentialsException ex = new BadCredentialsException("Invalid email or password");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleBadCredentials(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(401, response.getBody().getStatus());
        assertEquals("Unauthorized", response.getBody().getError());
    }

    @Test
    @DisplayName("Handle AccessDeniedException returns 403 Forbidden")
    void testHandleAccessDenied() {
        AccessDeniedException ex = new AccessDeniedException("Forbidden");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleAccessDenied(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(403, response.getBody().getStatus());
        assertEquals("Forbidden", response.getBody().getError());
        assertTrue(response.getBody().getMessage().contains("Access denied"));
    }

    @Test
    @DisplayName("Handle AuthenticationException returns 401 Unauthorized")
    void testHandleAuthentication() {
        AuthenticationException ex = new AuthenticationException("Full authentication is required to access this resource") {};

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleAuthentication(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(401, response.getBody().getStatus());
    }

    @Test
    @DisplayName("Handle IllegalArgumentException returns 400 Bad Request")
    void testHandleIllegalArgument() {
        IllegalArgumentException ex = new IllegalArgumentException("Bad input parameter");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleIllegalArgumentAndState(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Bad Request", response.getBody().getError());
    }

    @Test
    @DisplayName("Handle HttpMessageNotReadableException returns 400 Bad Request")
    void testHandleHttpMessageNotReadable() {
        HttpMessageNotReadableException ex = mock(HttpMessageNotReadableException.class);

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleHttpMessageNotReadable(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Malformed Request", response.getBody().getError());
    }

    @Test
    @DisplayName("Handle MethodArgumentTypeMismatchException returns 400 Bad Request")
    void testHandleMethodArgumentTypeMismatch() {
        MethodArgumentTypeMismatchException ex = mock(MethodArgumentTypeMismatchException.class);
        when(ex.getName()).thenReturn("id");
        doReturn(Long.class).when(ex).getRequiredType();

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleMethodArgumentTypeMismatch(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Invalid Parameter", response.getBody().getError());
        assertTrue(response.getBody().getMessage().contains("Parameter 'id' must be of type Long"));
    }

    @Test
    @DisplayName("Handle HttpRequestMethodNotSupportedException returns 405 Method Not Allowed")
    void testHandleMethodNotSupported() {
        HttpRequestMethodNotSupportedException ex = new HttpRequestMethodNotSupportedException("POST");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleMethodNotSupported(ex, request);

        assertEquals(HttpStatus.METHOD_NOT_ALLOWED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(405, response.getBody().getStatus());
        assertEquals("Method Not Allowed", response.getBody().getError());
    }

    @Test
    @DisplayName("Handle uncaught Exception returns 500 Internal Server Error")
    void testHandleGlobalException() {
        Exception ex = new RuntimeException("Unexpected database glitch");

        ResponseEntity<BidderErrorResponse> response = exceptionHandler.handleGlobalException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getStatus());
        assertEquals("Internal Server Error", response.getBody().getError());
        assertEquals("An unexpected error occurred while processing the request", response.getBody().getMessage());
    }
}
