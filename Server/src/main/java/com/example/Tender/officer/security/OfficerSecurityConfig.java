package com.example.Tender.officer.security;

import com.example.Tender.bidder.security.RateLimiterFilter;
import com.example.Tender.bidder.security.service.jwt.BidderAuthTokenFilter;
import com.example.Tender.officer.security.jwt.OfficerAuthEntryPointJwt;
import com.example.Tender.officer.security.jwt.OfficerAuthTokenFilter;
import com.example.Tender.officer.security.service.OfficerDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class OfficerSecurityConfig {

    private final OfficerDetailsServiceImpl officerDetailsService;
    private final OfficerAuthEntryPointJwt unauthorizedHandler;
    private final OfficerAuthTokenFilter officerAuthTokenFilter;
    private final BidderAuthTokenFilter bidderAuthTokenFilter;
    private final RateLimiterFilter rateLimitFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider =
                new DaoAuthenticationProvider(officerDetailsService);

        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {

        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)

                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(unauthorizedHandler)
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/officer/auth/**").permitAll()
                        .requestMatchers("/api/officer/identity/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/bidder/auth/**").permitAll()
                        .requestMatchers("/api/bidder/documents/verify-taxpayer").permitAll()
                        .requestMatchers("/api/bidder/documents/scan-taxpayer").permitAll()
                        .requestMatchers("/api/bidder/documents/tender-requirements").permitAll()
                        .requestMatchers("/api/bidder/documents/predict-compliance").permitAll()
                        .requestMatchers("/api/bidder/documents/batch-audit-files").permitAll()
                        .requestMatchers("/api/officer/tenders/document-types").permitAll()
                        .requestMatchers("/api/officer/tenders/ml-health").permitAll()
                        .requestMatchers("/api/officer/tenders/ml/gst-portal-status").permitAll()
                        .requestMatchers("/api/officer/tenders/ml/compliance-errors-catalog").permitAll()
                        .requestMatchers("/api/officer/tenders/ml/cis-weights").permitAll()
                        .requestMatchers("/api/officer/tenders/ml/clearance-statistics").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated()
                );

        http.authenticationProvider(authenticationProvider());

        // Officer JWT filter
        http.addFilterBefore(
                officerAuthTokenFilter,
                UsernamePasswordAuthenticationFilter.class
        );

        // Bidder JWT filter
        http.addFilterBefore(
                bidderAuthTokenFilter,
                UsernamePasswordAuthenticationFilter.class
        );

        // Rate limiting filter
        http.addFilterBefore(
                rateLimitFilter,
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(List.of(
                "https://gem-compliflix.vercel.app",
                "https://*.vercel.app",
                "http://localhost:[*]",
                "http://127.0.0.1:[*]",
                "*"
        ));

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "OPTIONS",
                        "PATCH",
                        "HEAD"
                )
        );

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of(
                "Authorization",
                "Content-Disposition",
                "Content-Type",
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}