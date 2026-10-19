package com.example.Tender.config;

import com.example.Tender.auth.dto.LoginRequest;
import com.example.Tender.auth.dto.LoginResponse;
import com.example.Tender.auth.service.CommonAuthService;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.officer.config.DatabaseSchemaInitializer;
import com.example.Tender.officer.repository.OfficerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class DatabaseSeedRunnerTest {

    @Autowired
    private DatabaseSchemaInitializer schemaInitializer;

    @Autowired
    private OfficerRepository officerRepository;

    @Autowired
    private BidderRepository bidderRepository;

    @Autowired
    private CommonAuthService commonAuthService;

    @Test
    public void testSeedDataExecuted() {
        schemaInitializer.run();
        assertTrue(officerRepository.existsByEmail("vanshsharma0963@gmail.com"));
        assertTrue(officerRepository.existsByEmail("arnavtyagi96@gmail.com"));
        assertTrue(officerRepository.existsByEmail("officer@gem.gov.in"));
        assertTrue(bidderRepository.existsByEmail("rajatsre455@gmail.com"));
        assertTrue(bidderRepository.existsByEmail("arnavtyagibhai@gmail.com"));
        assertTrue(bidderRepository.existsByEmail("arnav24169006@gmail.com"));
        assertTrue(bidderRepository.existsByEmail("bidder@acme.com"));
    }

    @Test
    public void testOfficerLoginWithDummyCredentials() {
        LoginResponse vanshResp = commonAuthService.login(LoginRequest.builder()
                .email("vanshsharma0963@gmail.com")
                .password("Vansh@123")
                .build());

        assertNotNull(vanshResp);
        assertTrue(vanshResp.isSuccess());
        assertEquals("OFFICER", vanshResp.getUser().getRole());

        LoginResponse officerResp = commonAuthService.login(LoginRequest.builder()
                .email("arnavtyagi96@gmail.com")
                .password("OfficerPass@2026")
                .build());

        assertNotNull(officerResp);
        assertTrue(officerResp.isSuccess());
        assertNotNull(officerResp.getToken());
        assertEquals("OFFICER", officerResp.getUser().getRole());

        LoginResponse officer2Resp = commonAuthService.login(LoginRequest.builder()
                .email("officer@gem.gov.in")
                .password("Password@123")
                .build());

        assertNotNull(officer2Resp);
        assertTrue(officer2Resp.isSuccess());
        assertEquals("OFFICER", officer2Resp.getUser().getRole());
    }

    @Test
    public void testBidderLoginWithDummyCredentials() {
        LoginResponse rajatResp = commonAuthService.login(LoginRequest.builder()
                .email("rajatsre455@gmail.com")
                .password("Rajat@123")
                .build());

        assertNotNull(rajatResp);
        assertTrue(rajatResp.isSuccess());
        assertEquals("BIDDER", rajatResp.getUser().getRole());

        LoginResponse bidderResp = commonAuthService.login(LoginRequest.builder()
                .email("arnavtyagibhai@gmail.com")
                .password("Password123")
                .build());

        assertNotNull(bidderResp);
        assertTrue(bidderResp.isSuccess());
        assertNotNull(bidderResp.getToken());
        assertEquals("BIDDER", bidderResp.getUser().getRole());

        LoginResponse bidder2Resp = commonAuthService.login(LoginRequest.builder()
                .email("arnav24169006@gmail.com")
                .password("Password@123")
                .build());

        assertNotNull(bidder2Resp);
        assertTrue(bidder2Resp.isSuccess());
        assertEquals("BIDDER", bidder2Resp.getUser().getRole());

        LoginResponse bidder3Resp = commonAuthService.login(LoginRequest.builder()
                .email("bidder@acme.com")
                .password("Password@123")
                .build());

        assertNotNull(bidder3Resp);
        assertTrue(bidder3Resp.isSuccess());
        assertEquals("BIDDER", bidder3Resp.getUser().getRole());
    }
}
