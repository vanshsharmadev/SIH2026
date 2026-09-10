package com.example.Tender.officer.security.jwt;

import com.example.Tender.officer.security.service.OfficerDetailsServiceImpl;
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
public class OfficerAuthTokenFilter extends OncePerRequestFilter {

    private final OfficerJwtUtils officerJwtUtils;
    private final OfficerDetailsServiceImpl officerDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null && officerJwtUtils.validateJwtToken(jwt)) {
                String role = officerJwtUtils.getRoleFromJwtToken(jwt);
                // If role is explicitly BIDDER, skip officer filter so BidderAuthTokenFilter can authenticate it
                if (!"BIDDER".equalsIgnoreCase(role)) {
                    String username = officerJwtUtils.getUsernameFromJwtToken(jwt);
                    try {
                        UserDetails userDetails = officerDetailsService.loadUserByUsername(username);
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        userDetails.getAuthorities()
                                );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
                        log.debug("Officer not found with username: {}", username);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Cannot set officer authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}
