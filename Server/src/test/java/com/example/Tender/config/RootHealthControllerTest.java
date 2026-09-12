package com.example.Tender.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for RootHealthController.
 * Verifies that root '/' and '/health' endpoints return 200 OK with expected JSON body.
 */
class RootHealthControllerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        RootHealthController controller = new RootHealthController();
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET / - 200 OK root health check")
    void testRootEndpoint() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.service", is("SIH2026 Tender Backend")))
                .andExpect(jsonPath("$.message", is("Server is running and healthy")));
    }

    @Test
    @DisplayName("GET /health - 200 OK health check")
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.service", is("SIH2026 Tender Backend")))
                .andExpect(jsonPath("$.message", is("Server is running and healthy")));
    }
}
