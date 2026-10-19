package com.example.Tender.officer.config;

import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.entity.BidderVerification;
import com.example.Tender.bidder.entity.MockGstRecord;
import com.example.Tender.bidder.entity.MockPanRecord;
import com.example.Tender.bidder.entity.MockUdyamRecord;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.repository.BidderVerificationRepository;
import com.example.Tender.bidder.repository.MockGstRecordRepository;
import com.example.Tender.bidder.repository.MockPanRecordRepository;
import com.example.Tender.bidder.repository.MockUdyamRecordRepository;
import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.model.OfficerRole;
import com.example.Tender.officer.model.OfficerVerificationStatus;
import com.example.Tender.officer.repository.OfficerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final OfficerRepository officerRepository;
    private final BidderRepository bidderRepository;
    private final BidderVerificationRepository bidderVerificationRepository;
    private final MockGstRecordRepository mockGstRecordRepository;
    private final MockPanRecordRepository mockPanRecordRepository;
    private final MockUdyamRecordRepository mockUdyamRecordRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Checking and adjusting database schema if necessary...");
        adjustSchema();

        log.info("Seeding initial dummy and test accounts for Officer and Bidder...");
        seedDummyData();

        log.info("Database schema synchronization and dummy data seeding completed successfully.");
    }

    private void adjustSchema() {
        try {
            jdbcTemplate.execute("ALTER TABLE officer_temp_registrations DROP COLUMN IF EXISTS otp");
        } catch (Exception e) {
            log.debug("Notice on officer_temp_registrations: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE bidder_temp_registrations ALTER COLUMN pan_number DROP NOT NULL");
        } catch (Exception e) {
            log.debug("Notice on bidder_temp_registrations pan_number: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE bidders ALTER COLUMN pan_number DROP NOT NULL");
        } catch (Exception e) {
            log.debug("Notice on bidders pan_number: {}", e.getMessage());
        }
    }

    private void seedDummyData() {
        seedOfficers();
        seedBidders();
        seedBidderVerifications();
        seedMockRecords();
    }

    private void seedOfficers() {
        // 1. Primary Officer (from API spec and documentation)
        seedOfficer(
                "Arnav Tyagi",
                "arnavtyagi96@gmail.com",
                "OfficerPass@2026",
                "9876543210",
                1,
                "Public Works Department"
        );

        // 2. Standard Demo Officer
        seedOfficer(
                "GeM Procurement Officer",
                "officer@gem.gov.in",
                "Password@123",
                "9876500001",
                1,
                "GeM Procurement Division"
        );
    }

    private void seedOfficer(String name, String email, String rawPassword, String mobile, int deptId, String deptName) {
        String normalizedEmail = email.trim().toLowerCase();
        if (!officerRepository.existsByEmail(normalizedEmail)) {
            Officer officer = Officer.builder()
                    .name(name)
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(rawPassword))
                    .mobile(mobile)
                    .departmentId(deptId)
                    .departmentName(deptName)
                    .role(OfficerRole.ROLE_OFFICER)
                    .verificationStatus(OfficerVerificationStatus.VERIFIED)
                    .identityProvider("DigiLocker")
                    .identityVerifiedAt(LocalDateTime.now())
                    .build();
            officerRepository.save(officer);
            log.info("Seeded dummy Officer: {} ({}) with password: {}", name, normalizedEmail, rawPassword);
        }
    }

    private void seedBidders() {
        // 1. Primary Bidder (from API documentation)
        seedBidder(
                "Rahul Sharma",
                "Rahul Sharma",
                "ABC Technologies Pvt Ltd",
                "arnavtyagibhai@gmail.com",
                "Password123",
                "9876543210",
                "09ABCDE1234F1Z5"
        );

        // 2. Secondary Bidder (from Client defaults & tests)
        seedBidder(
                "Arnav Tyagi",
                "Arnav Tyagi",
                "Apex Infotech Ltd",
                "arnav24169006@gmail.com",
                "Password@123",
                "9876500103",
                "09ARNAV9012H3Z7"
        );

        // 3. Standard Demo Bidder
        seedBidder(
                "ACME Vendor",
                "ACME Technologies Enterprise",
                "ACME Technologies Enterprise",
                "bidder@acme.com",
                "Password@123",
                "9876543211",
                "27ABCDE1234F1Z5"
        );
    }

    private void seedBidder(String authPerson, String legalName, String companyName, String email, String rawPassword, String phone, String gst) {
        String normalizedEmail = email.trim().toLowerCase();
        String normalizedGst = gst.trim().toUpperCase();

        if (!bidderRepository.existsByEmail(normalizedEmail)) {
            Bidder bidder = Bidder.builder()
                    .authorizedPersonName(authPerson)
                    .legalName(legalName)
                    .companyName(companyName)
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(rawPassword))
                    .phone(phone)
                    .gstNumber(normalizedGst)
                    .role("BIDDER")
                    .isVerified(true)
                    .gstVerified(true)
                    .emailVerified(true)
                    .gstVerifiedAt(LocalDateTime.now())
                    .emailVerifiedAt(LocalDateTime.now())
                    .build();
            bidderRepository.save(bidder);
            log.info("Seeded dummy Bidder: {} ({}) with password: {}", companyName, normalizedEmail, rawPassword);
        }
    }

    private void seedBidderVerifications() {
        seedBidderVerification("Rahul Sharma", "arnavtyagibhai@gmail.com", "09ABCDE1234F1Z5");
        seedBidderVerification("Arnav Tyagi", "arnav24169006@gmail.com", "09ARNAV9012H3Z7");
        seedBidderVerification("ACME Technologies Enterprise", "bidder@acme.com", "27ABCDE1234F1Z5");
    }

    private void seedBidderVerification(String name, String email, String gstNumber) {
        if (bidderVerificationRepository.findByEmailIgnoreCase(email).isEmpty()) {
            bidderVerificationRepository.save(BidderVerification.builder()
                    .name(name)
                    .email(email)
                    .gstNumber(gstNumber)
                    .build());
            log.info("Seeded BidderVerification for: {}", email);
        }
    }

    private void seedMockRecords() {
        // Mock GST Records
        seedMockGst("09ABCDE1234F1Z5", "Rahul Sharma", "ABCDE1234F", "09", "ACTIVE");
        seedMockGst("09ARNAV9012H3Z7", "Arnav Tyagi", "ARNAV9012H", "09", "ACTIVE");
        seedMockGst("27ABCDE1234F1Z5", "ACME Technologies Enterprise", "ABCDE1234F", "27", "ACTIVE");

        // Mock PAN Records
        seedMockPan("ABCDE1234F", "Rahul Sharma", "INDIVIDUAL");
        seedMockPan("ARNAV9012H", "Arnav Tyagi", "INDIVIDUAL");

        // Mock Udyam Records
        seedMockUdyam("UDYAM-UP-01-0012345", "Apex Infotech Ltd", "MICRO", "SERVICES", "VERIFIED");
    }

    private void seedMockGst(String gst, String legalName, String pan, String stateCode, String status) {
        if (mockGstRecordRepository.findByGstNumber(gst).isEmpty()) {
            mockGstRecordRepository.save(MockGstRecord.builder()
                    .gstNumber(gst)
                    .legalName(legalName)
                    .panNumber(pan)
                    .stateCode(stateCode)
                    .status(status)
                    .build());
        }
    }

    private void seedMockPan(String pan, String registeredName, String category) {
        if (mockPanRecordRepository.findByPanNumber(pan).isEmpty()) {
            mockPanRecordRepository.save(MockPanRecord.builder()
                    .panNumber(pan)
                    .registeredName(registeredName)
                    .panCategory(category)
                    .build());
        }
    }

    private void seedMockUdyam(String udyam, String enterpriseName, String type, String activity, String status) {
        if (mockUdyamRecordRepository.findByUdyamNumber(udyam).isEmpty()) {
            mockUdyamRecordRepository.save(MockUdyamRecord.builder()
                    .udyamNumber(udyam)
                    .enterpriseName(enterpriseName)
                    .enterpriseType(type)
                    .majorActivity(activity)
                    .status(status)
                    .build());
        }
    }
}
