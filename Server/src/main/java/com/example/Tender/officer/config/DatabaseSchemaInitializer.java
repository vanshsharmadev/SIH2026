package com.example.Tender.officer.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("Checking and adjusting database schema if necessary...");
            // Remove legacy columns from older migrations if present
            jdbcTemplate.execute("ALTER TABLE officer_temp_registrations DROP COLUMN IF EXISTS otp");
            log.info("Database schema synchronization completed successfully.");
        } catch (Exception e) {
            log.warn("Database schema adjustment notice: {}", e.getMessage());
        }
    }
}
