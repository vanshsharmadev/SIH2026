package com.example.Tender.bidder.security.service.jwt;

import com.example.Tender.bidder.security.service.BidderDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class BidderAuthTokenFilter extends OncePerRequestFilter {

    private final BidderJwtUtils bidderJwtUtils;
    private final BidderDetailsServiceImpl bidderDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // Only authenticate if not already authenticated by Officer filter
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                String jwt = parseJwt(request);

                if (jwt != null && bidderJwtUtils.validateJwtToken(jwt)) {
                    String role = bidderJwtUtils.getRoleFromJwtToken(jwt);
                    // If role is explicitly OFFICER or ADMIN, skip bidder filter
                    if (!"OFFICER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
                        String username = bidderJwtUtils.getUsernameFromJwtToken(jwt);
                        try {
                            UserDetails userDetails = bidderDetailsService.loadUserByUsername(username);

                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails,
                                            null,
                                            userDetails.getAuthorities()
                                    );

                            authentication.setDetails(
                                    new WebAuthenticationDetailsSource()
                                            .buildDetails(request)
                            );

                            SecurityContextHolder.getContext()
                                    .setAuthentication(authentication);
                        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
                            log.debug("Bidder not found with username: {}", username);
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.error(
                    "Cannot set bidder authentication: {}",
                    e.getMessage()
            );
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {

        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth)
                && headerAuth.startsWith("Bearer ")) {

            return headerAuth.substring(7);
        }

        return null;
    }
}