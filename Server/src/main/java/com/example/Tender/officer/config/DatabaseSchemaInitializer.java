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
        log.info("Checking and adjusting database schema if necessary...");
        try {
            // Remove legacy columns from older migrations if present
            jdbcTemplate.execute("ALTER TABLE officer_temp_registrations DROP COLUMN IF EXISTS otp");
        } catch (Exception e) {
            log.debug("Notice on officer_temp_registrations: {}", e.getMessage());
        }

        try {
            // Drop NOT NULL constraint on pan_number in bidder tables
            jdbcTemplate.execute("ALTER TABLE bidder_temp_registrations ALTER COLUMN pan_number DROP NOT NULL");
        } catch (Exception e) {
            log.debug("Notice on bidder_temp_registrations pan_number: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE bidders ALTER COLUMN pan_number DROP NOT NULL");
        } catch (Exception e) {
            log.debug("Notice on bidders pan_number: {}", e.getMessage());
        }

        log.info("Database schema synchronization completed successfully.");
    }
}
