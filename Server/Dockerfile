# ==========================================
# Multi-Stage Dockerfile for Spring Boot App
# ==========================================

# ------------------------------------------
# Stage 1: Build & Package the Application
# ------------------------------------------
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# 1. Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 2. Copy source code and package JAR (skipping unit tests during container build)
COPY src ./src
RUN mvn clean package -DskipTests -B

# ------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------
FROM eclipse-temurin:17-jre-alpine AS runner

WORKDIR /app

# Create a non-root dedicated user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy built JAR from builder stage
COPY --from=builder --chown=spring:spring /build/target/*.jar /app/app.jar

# Expose Spring Boot default port
EXPOSE 8080

# Production JVM Performance & Memory Tuning
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -Djava.net.preferIPv4Stack=true"

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/officer/tenders/document-types || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
