package com.example.Tender.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Root and General Health Check Controller.
 * Provides unauthenticated, lightweight status endpoints for container probes,
 * uptime monitors, and keep-alive pingers without triggering database overhead.
 */
@RestController
public class RootHealthController {

    /**
     * Handles root '/' and '/health' ping requests.
     *
     * @return ResponseEntity containing health status map with UP status, service descriptor, and timestamp.
     */
    @GetMapping({"/", "/health"})
    public ResponseEntity<Map<String, Object>> rootHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "SIH2026 Tender Backend",
                "message", "Server is running and healthy",
                "timestamp", System.currentTimeMillis()
        ));
    }
}
