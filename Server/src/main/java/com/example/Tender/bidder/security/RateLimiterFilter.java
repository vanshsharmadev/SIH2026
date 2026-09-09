package com.example.Tender.bidder.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RateLimiterFilter extends OncePerRequestFilter {

    private final RateLimiter rateLimiter;

    private int[] getLimit(String path) {

        switch (path) {
            case "/api/bidder/auth/login":
                return new int[]{5, 60};

            case "/api/bidder/auth/signup":
                return new int[]{5, 60};

            case "/api/bidder/auth/forgot-password":
                return new int[]{3, 60};

            case "/api/bidder/auth/resend-otp":
                return new int[]{3, 60};

            case "/api/bidder/auth/verify-otp":
                return new int[]{5, 60};

            case "/api/bidder/auth/verify-forgot-password-otp":
                return new int[]{5, 60};

            case "/api/bidder/auth/reset-password":
                return new int[]{5, 60};

            case "/api/bidder/auth/verify-pan":
                return new int[]{5, 60};

            case "/api/bidder/auth/verify-gst":
                return new int[]{5, 60};

            case "/api/bidder/auth/verify-udyam":
                return new int[]{5, 60};

            case "/api/bidder/auth/verify-business":
                return new int[]{5, 60};

            default:
                return null;
        }
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getServletPath();

        int[] limit = getLimit(path);

        if (limit != null) {

            String clientIp = request.getRemoteAddr();
            String key = clientIp + ":" + path;

            if (!rateLimiter.isAllowed(key, limit[0], limit[1])) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"status\":429,\"message\":\"Too many requests. Please try again later.\"}"
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}