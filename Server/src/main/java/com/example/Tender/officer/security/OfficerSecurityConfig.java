package com.example.Tender.officer.security;

import com.example.Tender.bidder.security.RateLimiterFilter;
import com.example.Tender.bidder.security.service.jwt.BidderAuthTokenFilter;
import com.example.Tender.config.CustomAccessDeniedHandler;
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
    private final CustomAccessDeniedHandler accessDeniedHandler;
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

    /**
     * Configures the main HTTP security filter chain.
     * Disables CSRF for stateless JWT operations, configures exception handlers,
     * enforces session policy, and defines public authorization rules for health endpoints.
     *
     * @param http HttpSecurity configuration builder
     * @return Built SecurityFilterChain instance
     * @throws Exception If any security configuration fails
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)

                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedHandler)
                        .accessDeniedHandler(accessDeniedHandler)
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/health", "/auth", "/auth/**", "/api/auth", "/api/auth/**").permitAll()
                        .requestMatchers("/tenders", "/tenders/**", "/api/tenders", "/api/tenders/**").permitAll()
                        .requestMatchers("/api/officer/auth/**").permitAll()
                        .requestMatchers("/api/officer/identity/**").permitAll()
                        .requestMatchers("/api/bidder/auth/**").permitAll()
                        .requestMatchers("/api/bidder/documents/verify-taxpayer").permitAll()
                        .requestMatchers("/api/bidder/documents/scan-taxpayer").permitAll()
                        .requestMatchers("/api/bidder/documents/tender-requirements").permitAll()
                        .requestMatchers("/api/bidder/documents/predict-compliance").permitAll()
                        .requestMatchers("/api/bidder/documents/batch-audit-files").permitAll()
                        .requestMatchers("/api/officer/tenders/document-types").permitAll()
                        .requestMatchers("/api/officer/tenders/ml-health").permitAll()
                        .requestMatchers("/api/officer/tenders/rag-health").permitAll()
                        .requestMatchers("/api/officer/tenders/chat/health").permitAll()
                        .requestMatchers("/api/officer/tenders/chat").permitAll()
                        .requestMatchers("/api/officer/tenders/*/chat").permitAll()
                        .requestMatchers("/api/officer/tenders/top-10").permitAll()
                        .requestMatchers("/api/officer/tenders/*/top-10").permitAll()
                        .requestMatchers("/api/officer/tenders/*/top-bidders").permitAll()
                        .requestMatchers("/api/officer/tenders/submissions", "/api/officer/tenders/submissions/**", "/api/officer/tenders/*/submissions").permitAll()
                        .requestMatchers("/api/bidder/documents/submit-bid", "/api/bidder/documents/my-bids").permitAll()
                        .requestMatchers("/api/officer/tenders/ml/**").permitAll()
                        .requestMatchers("/api/ai/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/officer", "/api/officer/**").hasAnyRole("OFFICER", "ADMIN")
                        .requestMatchers("/api/bidder", "/api/bidder/**").hasRole("BIDDER")
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