package com.example.Tender.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@Order(Ordered.HIGHEST_PRECEDENCE)
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String DEFAULT_NEW_JDBC = "jdbc:postgresql://ep-royal-dew-b4rst5e7-pooler.c-6.us-east-2.aws.neon.tech:5432/neondb?sslmode=require";
    private static final String DEFAULT_NEW_USER = "neondb_owner";
    private static final String DEFAULT_NEW_PASS = "npg_b0BSayizAH3m";
    private static final String OLD_QUOTA_EXCEEDED_HOST = "ep-flat-bonus-aygklyw7";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> map = new HashMap<>();

        // 1. Load local .env files if present
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

        // 2. Resolve database configuration from System Environment, Render properties, or Dotenv
        resolveDatabaseProperties(environment, map);

        if (!map.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("dotenvProperties", map));
        }
    }

    private void resolveDatabaseProperties(ConfigurableEnvironment environment, Map<String, Object> map) {
        String dbUrl = getVal(environment, map, "DB_URL");
        String databaseUrl = getVal(environment, map, "DATABASE_URL");

        // If DB_URL or DATABASE_URL contains the quota-exceeded old Neon host, discard it
        if (dbUrl != null && dbUrl.contains(OLD_QUOTA_EXCEEDED_HOST)) {
            dbUrl = null;
        }
        if (databaseUrl != null && databaseUrl.contains(OLD_QUOTA_EXCEEDED_HOST)) {
            databaseUrl = null;
        }

        String targetUrl = (databaseUrl != null && !databaseUrl.isBlank()) ? databaseUrl : dbUrl;

        if (targetUrl != null && !targetUrl.isBlank()) {
            try {
                String clean = targetUrl.trim().replaceFirst("^jdbc:", "");
                if (clean.startsWith("postgres://")) {
                    clean = "postgresql://" + clean.substring("postgres://".length());
                }

                if (clean.startsWith("postgresql://")) {
                    URI uri = URI.create(clean);
                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = (uri.getPath() != null && !uri.getPath().isEmpty()) ? uri.getPath() : "/neondb";

                    String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path + "?sslmode=require";
                    map.put("spring.datasource.url", jdbcUrl);
                    map.put("DB_URL", jdbcUrl);

                    if (uri.getUserInfo() != null && uri.getUserInfo().contains(":")) {
                        String[] parts = uri.getUserInfo().split(":", 2);
                        map.put("spring.datasource.username", parts[0]);
                        map.put("DB_USERNAME", parts[0]);
                        map.put("spring.datasource.password", parts[1]);
                        map.put("DB_PASSWORD", parts[1]);
                    }
                    return;
                } else if (clean.startsWith("jdbc:postgresql://") || targetUrl.startsWith("jdbc:")) {
                    map.put("spring.datasource.url", targetUrl);
                    map.put("DB_URL", targetUrl);
                    return;
                }
            } catch (Exception e) {
                // fallback to default if parsing failed
            }
        }

        // If neither was provided or old database was detected, apply default new Neon DB
        if (!map.containsKey("spring.datasource.url")) {
            map.put("spring.datasource.url", DEFAULT_NEW_JDBC);
            map.put("DB_URL", DEFAULT_NEW_JDBC);
            map.put("spring.datasource.username", DEFAULT_NEW_USER);
            map.put("DB_USERNAME", DEFAULT_NEW_USER);
            map.put("spring.datasource.password", DEFAULT_NEW_PASS);
            map.put("DB_PASSWORD", DEFAULT_NEW_PASS);
        }
    }

    private String getVal(ConfigurableEnvironment env, Map<String, Object> map, String key) {
        String val = System.getenv(key);
        if (val != null && !val.isBlank()) return val;
        val = System.getProperty(key);
        if (val != null && !val.isBlank()) return val;
        if (env.containsProperty(key) && env.getProperty(key) != null && !env.getProperty(key).isBlank()) {
            return env.getProperty(key);
        }
        if (map.containsKey(key) && map.get(key) != null) {
            return map.get(key).toString();
        }
        return null;
    }
}
