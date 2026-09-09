package com.example.Tender.officer.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class BrevoEmailService {

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email:noreply@tenderportal.gov.in}")
    private String senderEmail;

    @Value("${brevo.sender.name:Tender Portal}")
    private String senderName;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    public boolean sendOtpEmail(String recipientEmail, String recipientName, String otp, int validityMinutes) {
        return sendOtpEmail(recipientEmail, recipientName, otp, validityMinutes, "Officer");
    }

    public boolean sendBidderOtpEmail(String recipientEmail, String recipientName, String otp, int validityMinutes) {
        return sendOtpEmail(recipientEmail, recipientName, otp, validityMinutes, "Bidder");
    }

    public boolean sendOtpEmail(String recipientEmail, String recipientName, String otp, int validityMinutes, String accountType) {
        try {
            RestClient restClient = RestClient.builder().build();

            // Safe fallback to verified sender if sender is missing or unauthenticated default domain
            String effectiveSender = (senderEmail != null && !senderEmail.trim().isEmpty() && !senderEmail.contains("noreply@tenderportal.gov.in"))
                    ? senderEmail.trim()
                    : "arnavtyagi96@gmail.com";

            String roleLabel = "Bidder".equalsIgnoreCase(accountType) ? "Bidder" : "Officer";
            String defaultName = "Bidder".equalsIgnoreCase(accountType) ? "Bidder" : "Officer";

            Map<String, String> sender = new HashMap<>();
            sender.put("name", senderName != null ? senderName : "Tender Portal");
            sender.put("email", effectiveSender);

            Map<String, String> recipient = new HashMap<>();
            recipient.put("name", recipientName != null ? recipientName : defaultName);
            recipient.put("email", recipientEmail);

            String htmlBody = buildOtpHtmlContent(recipientName, otp, validityMinutes, roleLabel);

            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", sender);
            payload.put("to", Collections.singletonList(recipient));
            payload.put("subject", "Verify Your " + roleLabel + " Account - OTP Verification");
            payload.put("htmlContent", htmlBody);

            restClient.post()
                    .uri(BREVO_API_URL)
                    .header("api-key", apiKey)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("{} OTP verification email successfully sent to {}", roleLabel, recipientEmail);
            return true;
        } catch (Exception e) {
            log.error("Failed to send {} OTP email via Brevo to {}: {}", accountType, recipientEmail, e.getMessage());
            return false;
        }
    }

    private String buildOtpHtmlContent(String recipientName, String otp, int validityMinutes, String roleLabel) {
        String greetingName = recipientName != null ? recipientName : roleLabel;
        String lowercaseRole = roleLabel.toLowerCase();
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "<meta charset='utf-8'>"
                + "<style>"
                + "body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }"
                + ".card { background: #ffffff; max-width: 520px; margin: 0 auto; border-radius: 12px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }"
                + ".header { text-align: center; border-bottom: 1px solid #e9ecef; padding-bottom: 20px; margin-bottom: 24px; }"
                + ".title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }"
                + ".greeting { font-size: 15px; color: #475569; margin-bottom: 16px; }"
                + ".otp-box { background: #f1f5f9; border: 2px dashed #0284c7; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0; }"
                + ".otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0369a1; margin: 0; font-family: monospace; }"
                + ".validity { font-size: 13px; color: #64748b; text-align: center; margin-top: 8px; }"
                + ".footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e9ecef; font-size: 12px; color: #94a3b8; text-align: center; }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class='card'>"
                + "  <div class='header'>"
                + "    <h2 class='title'>Tender Portal - " + roleLabel + " Verification</h2>"
                + "  </div>"
                + "  <p class='greeting'>Hello <strong>" + greetingName + "</strong>,</p>"
                + "  <p style='color: #475569; font-size: 14px;'>Use the one-time password (OTP) below to verify your email address and activate your " + lowercaseRole + " account:</p>"
                + "  <div class='otp-box'>"
                + "    <div class='otp-code'>" + otp + "</div>"
                + "    <div class='validity'>Valid for " + validityMinutes + " minutes</div>"
                + "  </div>"
                + "  <p style='color: #64748b; font-size: 13px;'>If you did not request this verification, please disregard this email.</p>"
                + "  <div class='footer'>"
                + "    © Tender Portal • Secure " + roleLabel + " Verification"
                + "  </div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }
}
