package com.example.Tender.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootHealthController {

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
