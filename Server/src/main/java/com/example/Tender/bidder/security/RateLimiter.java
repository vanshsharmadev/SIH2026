package com.example.Tender.bidder.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimiter {

    @Value("${rate-limit.login.requests:5}")
    private int maxRequests;

    @Value("${rate-limit.login.window-seconds:60}")
    private long windowSeconds;

    private final Map<String, RequestInfo> requests = new ConcurrentHashMap<>();

    public boolean isAllowed(String clientIp) {

        long now = System.currentTimeMillis();

        RequestInfo info = requests.computeIfAbsent(
                clientIp,
                key -> new RequestInfo(now, 0)
        );

        synchronized (info) {

            if (now - info.windowStart >= windowSeconds * 1000) {
                info.windowStart = now;
                info.count = 0;
            }

            if (info.count >= maxRequests) {
                return false;
            }

            info.count++;
            return true;
        }
    }

    private static class RequestInfo {

        private long windowStart;
        private int count;

        public RequestInfo(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}