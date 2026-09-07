package com.example.Tender.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
@Slf4j
public class CloudinaryConfig {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${cloudinary.url:}")
    private String cloudinaryUrl;

    @Bean
    public Cloudinary cloudinary() {
        if (cloudinaryUrl != null && !cloudinaryUrl.isBlank() && !cloudinaryUrl.startsWith("cloudinary://your_")) {
            log.info("Configuring Cloudinary with CLOUDINARY_URL");
            return new Cloudinary(cloudinaryUrl);
        }

        if (cloudName != null && !cloudName.isBlank() && apiKey != null && !apiKey.isBlank()) {
            log.info("Configuring Cloudinary with cloudName: {}", cloudName);
            Map<String, String> config = new HashMap<>();
            config.put("cloud_name", cloudName);
            config.put("api_key", apiKey);
            config.put("api_secret", apiSecret);
            return new Cloudinary(config);
        }

        log.warn("Cloudinary credentials are not fully set. Initializing default Cloudinary instance.");
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", "tender-portal",
                "api_key", "default-key",
                "api_secret", "default-secret"
        ));
    }
}
