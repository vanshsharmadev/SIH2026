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
                        .requestMatchers("/api/officer/auth/**").permitAll()
                        .requestMatchers("/api/officer/identity/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/bidder/auth/**").permitAll()
                        .requestMatchers("/api/officer/tenders/document-types").permitAll()
                        .requestMatchers("/api/officer/tenders/ml-health").permitAll()
                        .requestMatchers("/api/officer/tenders/rag-health").permitAll()
                        .requestMatchers("/api/officer/tenders/chat/health").permitAll()
                        .requestMatchers("/api/officer/tenders/chat").permitAll()
                        .requestMatchers("/api/officer/tenders/*/chat").permitAll()
                        .requestMatchers("/api/officer/tenders/ml/**").permitAll()
                        .requestMatchers("/api/ai/**").permitAll()
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

        configuration.setAllowedOriginPatterns(List.of("*"));

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "OPTIONS",
                        "PATCH"
                )
        );

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}