package com.example.Tender.bidder.security;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimiter {

    private final Map<String, RequestInfo> requests = new ConcurrentHashMap<>();

    public boolean isAllowed(String key, int maxRequests, long windowSeconds) {

        long now = System.currentTimeMillis();

        RequestInfo info = requests.computeIfAbsent(
                key,
                k -> new RequestInfo(now, 0)
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