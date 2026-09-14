# ==========================================
# Multi-Stage Dockerfile for Spring Boot App
# ==========================================

# ------------------------------------------
# Stage 1: Build & Package the Application
# ------------------------------------------
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# 1. Cache Maven dependencies
COPY Server/pom.xml ./
RUN mvn dependency:go-offline -B

# 2. Copy source code and package JAR
COPY Server/src ./src
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

# Production JVM Performance & Memory Tuning (optimized for 512MB RAM containers)
ENV JAVA_OPTS="-Xms128m -Xmx280m -XX:MaxMetaspaceSize=128m -Xss512k -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom -Djava.net.preferIPv4Stack=true"

# Health check endpoint using fast lightweight /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-8080}/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
