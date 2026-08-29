package com.example.Tender.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

@Order(Ordered.HIGHEST_PRECEDENCE)
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> map = new HashMap<>();

        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> map.put(entry.getKey(), entry.getValue()));
        } catch (Exception ignored) {
        }

        try {
            Dotenv parentDotenv = Dotenv.configure().directory("../").ignoreIfMissing().load();
            parentDotenv.entries().forEach(entry -> map.putIfAbsent(entry.getKey(), entry.getValue()));
        } catch (Exception ignored) {
        }

        if (!map.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("dotenvProperties", map));
        }
    }
}
