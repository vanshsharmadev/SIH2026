package com.example.Tender.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcCorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(
                        "https://gem-compliflix.vercel.app",
                        "https://*.vercel.app",
                        "http://localhost:[*]",
                        "http://127.0.0.1:[*]",
                        "*"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD")
                .allowedHeaders("*")
                .exposedHeaders(
                        "Authorization",
                        "Content-Disposition",
                        "Content-Type",
                        "Access-Control-Allow-Origin",
                        "Access-Control-Allow-Credentials"
                )
                .allowCredentials(true)
                .maxAge(3600);
    }
}
