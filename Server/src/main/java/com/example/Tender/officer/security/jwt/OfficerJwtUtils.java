package com.example.Tender.officer.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class OfficerJwtUtils {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:86400000}")
    private int jwtExpirationMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret);
        } catch (IllegalArgumentException e) {
            keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateJwtToken(Authentication authentication) {
        if (authentication.getPrincipal() instanceof com.example.Tender.officer.security.service.OfficerPrincipal op) {
            String roleName = op.getRole() != null ? (op.getRole().name().startsWith("ROLE_") ? op.getRole().name().substring(5) : op.getRole().name()) : "OFFICER";
            return generateTokenWithClaims(op.getUsername(), op.getId(), roleName, op.getName());
        }
        UserDetails officerPrincipal = (UserDetails) authentication.getPrincipal();
        return generateTokenWithClaims(officerPrincipal.getUsername(), null, "OFFICER", null);
    }

    public String generateTokenFromUsername(String username) {
        return generateTokenWithClaims(username, null, "OFFICER", null);
    }

    public String generateTokenWithClaims(String username, Long userId, String role, String name) {
        var builder = Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs));

        if (userId != null) {
            builder.claim("userId", userId);
        }
        if (role != null) {
            builder.claim("role", role);
        }
        if (name != null) {
            builder.claim("name", name);
        }

        return builder.signWith(getSigningKey()).compact();
    }

    public Claims getClaimsFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getRoleFromJwtToken(String token) {
        try {
            Claims claims = getClaimsFromJwtToken(token);
            return claims.get("role", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public Long getUserIdFromJwtToken(String token) {
        try {
            Claims claims = getClaimsFromJwtToken(token);
            Object userId = claims.get("userId");
            if (userId instanceof Number number) {
                return number.longValue();
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public String getUsernameFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        } catch (Exception e) {
            log.error("JWT validation error: {}", e.getMessage());
        }
        return false;
    }
}
