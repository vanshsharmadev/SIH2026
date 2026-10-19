package com.example.Tender.config;

import org.junit.jupiter.api.Test;
import java.net.URI;
import static org.junit.jupiter.api.Assertions.*;

public class DatabaseUrlParserTest {

    @Test
    public void testParsePostgresUrl() {
        String raw = "postgresql://neondb_owner:npg_b0BSayizAH3m@ep-royal-dew-b4rst5e7-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
        String clean = raw.replaceFirst("^jdbc:", "");
        if (clean.startsWith("postgres://")) {
            clean = "postgresql://" + clean.substring("postgres://".length());
        }
        URI uri = URI.create(clean);

        assertNotNull(uri.getUserInfo());
        String[] userParts = uri.getUserInfo().split(":", 2);
        assertEquals("neondb_owner", userParts[0]);
        assertEquals("npg_b0BSayizAH3m", userParts[1]);

        assertEquals("ep-royal-dew-b4rst5e7-pooler.c-6.us-east-2.aws.neon.tech", uri.getHost());
        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        assertEquals(5432, port);
        assertEquals("/neondb", uri.getPath());

        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath() + "?sslmode=require";
        assertEquals("jdbc:postgresql://ep-royal-dew-b4rst5e7-pooler.c-6.us-east-2.aws.neon.tech:5432/neondb?sslmode=require", jdbcUrl);
    }
}
