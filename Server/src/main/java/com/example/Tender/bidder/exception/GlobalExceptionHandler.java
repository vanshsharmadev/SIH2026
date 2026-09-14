package com.example.Tender.bidder.exception;

import com.example.Tender.bidder.dto.BidderErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice(basePackages = "com.example.Tender.bidder")
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<BidderErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = error instanceof FieldError ? ((FieldError) error).getField() : error.getObjectName();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Validation Failed",
                "Validation failed for " + errors.size() + " field(s)",
                request.getRequestURI(),
                errors
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BidderNotFoundException.class)
    public ResponseEntity<BidderErrorResponse> handleBidderNotFound(
            BidderNotFoundException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(BidderAlreadyExistsException.class)
    public ResponseEntity<BidderErrorResponse> handleBidderAlreadyExists(
            BidderAlreadyExistsException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.CONFLICT.value(),
                "Conflict",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(BidderVerificationException.class)
    public ResponseEntity<BidderErrorResponse> handleBidderVerification(
            BidderVerificationException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Verification Failed",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<BidderErrorResponse> handleInvalidOtp(
            InvalidOtpException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Invalid OTP",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(OtpExpiredException.class)
    public ResponseEntity<BidderErrorResponse> handleOtpExpired(
            OtpExpiredException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "OTP Expired",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<BidderErrorResponse> handleInvalidToken(
            InvalidTokenException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Invalid Token",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BidderNotVerifiedException.class)
    public ResponseEntity<BidderErrorResponse> handleBidderNotVerified(
            BidderNotVerifiedException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                "Forbidden",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<BidderErrorResponse> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<BidderErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                "Forbidden",
                "Access denied: You do not have permission to access this resource",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<BidderErrorResponse> handleAuthentication(
            AuthenticationException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<BidderErrorResponse> handleIllegalArgumentAndState(
            RuntimeException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<BidderErrorResponse> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Malformed Request",
                "Malformed JSON request payload or invalid data format",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<BidderErrorResponse> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {

        String requiredType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "valid format";
        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Invalid Parameter",
                "Parameter '" + ex.getName() + "' must be of type " + requiredType,
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<BidderErrorResponse> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                "Method Not Allowed",
                "HTTP method '" + ex.getMethod() + "' is not supported for this endpoint",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(response);
    }

    @ExceptionHandler(BidderChatException.class)
    public ResponseEntity<BidderErrorResponse> handleBidderChatException(
            BidderChatException ex, HttpServletRequest request) {

        log.error("Bidder Chat error at path '{}' [status={}]: {}", request.getRequestURI(), ex.getStatus(), ex.getMessage());

        BidderErrorResponse response = BidderErrorResponse.of(
                ex.getStatus().value(),
                ex.getError() != null ? ex.getError() : "AI Service Error",
                ex.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<BidderErrorResponse> handleGlobalException(
            Exception ex, HttpServletRequest request) {

        log.error("Unhandled exception in bidder module at path '{}': ", request.getRequestURI(), ex);

        BidderErrorResponse response = BidderErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "An unexpected error occurred while processing the request",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}