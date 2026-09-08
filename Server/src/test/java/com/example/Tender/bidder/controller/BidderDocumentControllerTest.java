package com.example.Tender.bidder.controller;

import com.example.Tender.bidder.dto.ml.BidderCisCheckRequest;
import com.example.Tender.bidder.dto.ml.BidderCisCheckResponse;
import com.example.Tender.bidder.dto.ml.BidderDocumentResponse;
import com.example.Tender.bidder.dto.ml.BidderTaxpayerVerifyRequest;
import com.example.Tender.bidder.dto.ml.BidderTaxpayerVerifyResponse;
import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.exception.GlobalExceptionHandler;
import com.example.Tender.bidder.provider.MlBusinessVerificationProvider;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.security.BidderPrincipal;
import com.example.Tender.bidder.security.service.jwt.BidderJwtUtils;
import com.example.Tender.bidder.service.BidderDocumentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class BidderDocumentControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BidderDocumentService bidderDocumentService;

    @Mock
    private MlBusinessVerificationProvider mlVerificationProvider;

    @Mock
    private BidderRepository bidderRepository;

    @Mock
    private BidderJwtUtils bidderJwtUtils;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private BidderPrincipal mockPrincipal;

    @BeforeEach
    void setUp() {
        Bidder testBidder = Bidder.builder()
                .id(1L)
                .email("vendor@example.com")
                .legalName("Acme Corp")
                .password("encodedPass")
                .build();
        this.mockPrincipal = new BidderPrincipal(testBidder);

        // Custom argument resolver to inject mockPrincipal for @AuthenticationPrincipal
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return mockPrincipal;
            }
        };

        BidderDocumentController controller = new BidderDocumentController(
                bidderDocumentService,
                mlVerificationProvider,
                bidderRepository,
                bidderJwtUtils
        );

        this.mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/bidder/documents/upload - Successfully uploads and runs ML analysis")
    void testUploadDocument_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "pan_card.pdf", "application/pdf", "dummy pdf content".getBytes()
        );

        BidderDocumentResponse mockResponse = BidderDocumentResponse.builder()
                .id(100L)
                .bidderId(1L)
                .fileName("pan_card.pdf")
                .documentType("pan_card")
                .fileUrl("https://res.cloudinary.com/demo/image/upload/pan_card.pdf")
                .authenticityScore(95.0)
                .isAuthentic(true)
                .authenticityVerdict("AUTHENTIC_DIGITALLY_SIGNED")
                .verificationFlags(List.of("PDF_DIGITALLY_SIGNED", "CCA_GOV_CERTIFIED"))
                .status("VERIFIED")
                .createdAt(LocalDateTime.now())
                .build();

        when(bidderDocumentService.uploadAndAnalyze(any(), eq("pan_card"), eq(1L)))
                .thenReturn(mockResponse);

        mockMvc.perform(multipart("/api/bidder/documents/upload")
                        .file(file)
                        .param("documentType", "pan_card"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.fileName").value("pan_card.pdf"))
                .andExpect(jsonPath("$.authenticityScore").value(95.0))
                .andExpect(jsonPath("$.isAuthentic").value(true))
                .andExpect(jsonPath("$.authenticityVerdict").value("AUTHENTIC_DIGITALLY_SIGNED"))
                .andExpect(jsonPath("$.status").value("VERIFIED"));

        verify(bidderDocumentService).uploadAndAnalyze(any(), eq("pan_card"), eq(1L));
    }

    @Test
    @DisplayName("GET /api/bidder/documents - Retrieves list of uploaded documents")
    void testGetMyDocuments_Success() throws Exception {
        BidderDocumentResponse doc1 = BidderDocumentResponse.builder()
                .id(1L)
                .bidderId(1L)
                .fileName("gst_cert.pdf")
                .documentType("gst_certificate")
                .authenticityScore(92.0)
                .isAuthentic(true)
                .status("VERIFIED")
                .build();

        when(bidderDocumentService.getBidderDocuments(1L)).thenReturn(List.of(doc1));

        mockMvc.perform(get("/api/bidder/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fileName").value("gst_cert.pdf"))
                .andExpect(jsonPath("$[0].documentType").value("gst_certificate"));

        verify(bidderDocumentService).getBidderDocuments(1L);
    }

    @Test
    @DisplayName("GET /api/bidder/documents/{id} - Fetches single document details")
    void testGetDocumentById_Success() throws Exception {
        BidderDocumentResponse doc = BidderDocumentResponse.builder()
                .id(50L)
                .bidderId(1L)
                .fileName("udyam.pdf")
                .documentType("udyam_certificate")
                .authenticityScore(98.0)
                .isAuthentic(true)
                .status("VERIFIED")
                .build();

        when(bidderDocumentService.getBidderDocument(50L, 1L)).thenReturn(doc);

        mockMvc.perform(get("/api/bidder/documents/50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.fileName").value("udyam.pdf"));

        verify(bidderDocumentService).getBidderDocument(50L, 1L);
    }

    @Test
    @DisplayName("DELETE /api/bidder/documents/{id} - Deletes document and returns 204")
    void testDeleteDocument_Success() throws Exception {
        doNothing().when(bidderDocumentService).deleteDocument(50L, 1L);

        mockMvc.perform(delete("/api/bidder/documents/50"))
                .andExpect(status().isNoContent());

        verify(bidderDocumentService).deleteDocument(50L, 1L);
    }

    @Test
    @DisplayName("POST /api/bidder/documents/check-cis - Calculates CIS pre-submission readiness")
    void testCheckCis_Success() throws Exception {
        BidderCisCheckRequest request = BidderCisCheckRequest.builder()
                .tenderType("general")
                .requiredDocuments(List.of("pan_card", "gst_certificate"))
                .build();

        BidderCisCheckResponse mockCisResponse = BidderCisCheckResponse.builder()
                .success(true)
                .cisScore(0.89)
                .riskClassification("low_risk")
                .clearanceEligibility("ELIGIBLE_SINGLE_CLICK")
                .documentsAnalyzed(2)
                .missingDocuments(List.of())
                .recommendations(List.of("All criteria validated."))
                .build();

        when(bidderDocumentService.checkCisCompliance(eq(1L), any(BidderCisCheckRequest.class)))
                .thenReturn(mockCisResponse);

        mockMvc.perform(post("/api/bidder/documents/check-cis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.cisScore").value(0.89))
                .andExpect(jsonPath("$.riskClassification").value("low_risk"))
                .andExpect(jsonPath("$.clearanceEligibility").value("ELIGIBLE_SINGLE_CLICK"));

        verify(bidderDocumentService).checkCisCompliance(eq(1L), any(BidderCisCheckRequest.class));
    }

    @Test
    @DisplayName("POST /api/bidder/documents/verify-taxpayer - Validates GSTIN via ML Engine")
    void testVerifyTaxpayer_Success() throws Exception {
        BidderTaxpayerVerifyRequest request = BidderTaxpayerVerifyRequest.builder()
                .identifier("09ABCDE1234F1Z5")
                .identifierType("gstin")
                .expectedLegalName("Acme Corp")
                .useLivePortal(false)
                .build();

        BidderTaxpayerVerifyResponse mockResponse = BidderTaxpayerVerifyResponse.builder()
                .valid(true)
                .identifier("09ABCDE1234F1Z5")
                .identifierType("gstin")
                .legalName("Acme Corp")
                .nameMatched(true)
                .status("Active")
                .complianceScore(95.0)
                .riskLevel("LOW")
                .filingRatePercent(92.5)
                .isMlVerified(true)
                .verificationSource("ML_MICROSERVICE_LIVE")
                .build();

        when(mlVerificationProvider.verifyTaxpayer(eq("09ABCDE1234F1Z5"), eq("gstin"), eq("Acme Corp"), any(), eq(false)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/bidder/documents/verify-taxpayer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.identifier").value("09ABCDE1234F1Z5"))
                .andExpect(jsonPath("$.status").value("Active"))
                .andExpect(jsonPath("$.complianceScore").value(95.0))
                .andExpect(jsonPath("$.isMlVerified").value(true));

        verify(mlVerificationProvider).verifyTaxpayer(eq("09ABCDE1234F1Z5"), eq("gstin"), eq("Acme Corp"), any(), eq(false));
    }

    @Test
    @DisplayName("POST /api/bidder/documents/scan-taxpayer - Scans physical taxpayer certificate")
    void testScanTaxpayerDoc_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "tax_invoice.pdf", "application/pdf", "tax invoice content".getBytes()
        );

        Map<String, Object> scanResult = Map.of(
                "success", true,
                "compliance_score", 94.0,
                "compliance_verdict", "COMPLIANT"
        );

        when(mlVerificationProvider.scanAndVerifyTaxpayerDoc(any(), eq(false)))
                .thenReturn(scanResult);

        mockMvc.perform(multipart("/api/bidder/documents/scan-taxpayer")
                        .file(file)
                        .param("useLivePortal", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.compliance_score").value(94.0))
                .andExpect(jsonPath("$.compliance_verdict").value("COMPLIANT"));

        verify(mlVerificationProvider).scanAndVerifyTaxpayerDoc(any(), eq(false));
    }
}
