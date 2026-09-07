# 🚀 Docker & Cloud Deployment Guide

This guide explains how to build, run, and deploy the **SIH 2026 Tender Management & ML Intelligence Backend** using Docker and popular cloud platforms.

---

## 📋 Prerequisites
- **Docker Engine** & **Docker Compose** installed ([Install Docker Desktop](https://www.docker.com/products/docker-desktop/))
- `.env` file configured with your database, JWT, Cloudinary, and Brevo API credentials.

---

## 🐳 1. Run Locally with Docker

### Option A: Using Docker Compose (Recommended)
Make sure your `.env` file is present in the project root:
```bash
# Start container in background
docker compose up -d --build

# View real-time logs
docker compose logs -f

# Check health status
docker compose ps

# Stop container
docker compose down
```

### Option B: Using Docker CLI Directly
```bash
# 1. Build the Docker image
docker build -t tender-backend:latest .

# 2. Run container with environment variables from .env
docker run -d \
  --name tender-backend \
  -p 8080:8080 \
  --env-file .env \
  tender-backend:latest

# 3. View logs
docker logs -f tender-backend
```

The application will be accessible at: `http://localhost:8080`

---

## ☁️ 2. Deploy to Cloud Platforms

### A. Deploy to Render (Web Service)
1. Push this repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) -> **New +** -> **Web Service**.
3. Connect your GitHub repository (`Server` folder).
4. Configure settings:
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Server/Dockerfile` (or `./Dockerfile`)
   - **Docker Context**: `.`
5. In **Environment Variables**, add the keys from `.env`:
   - `DB_URL`: `jdbc:postgresql://<host>:<port>/<dbname>`
   - `DB_USERNAME`: `<username>`
   - `DB_PASSWORD`: `<password>`
   - `JWT_SECRET`: `<your_secret>`
   - `ML_SERVICE_BASE_URL`: `http://20.40.44.184`
   - `CLOUDINARY_CLOUD_NAME`: `<cloud_name>`
   - `CLOUDINARY_API_KEY`: `<api_key>`
   - `CLOUDINARY_API_SECRET`: `<api_secret>`
   - `CLOUDINARY_URL`: `<cloudinary_url>`
   - `BREVO_API_KEY`: `<brevo_api_key>`
6. Click **Deploy Web Service**.

---

### B. Deploy to Railway
1. Go to [Railway Dashboard](https://railway.app) -> **New Project** -> **Deploy from GitHub repo**.
2. Select your repository.
3. In **Variables**, paste all variables from your `.env` file.
4. Railway will automatically detect the `Dockerfile` and build the container.
5. In **Settings**, generate a public domain (e.g. `your-app.up.railway.app`).

---

### C. Deploy to AWS / Azure / DigitalOcean (VPS / Container)
```bash
# Push image to Docker Hub or AWS ECR / Azure ACR
docker tag tender-backend:latest <your-dockerhub-username>/tender-backend:latest
docker push <your-dockerhub-username>/tender-backend:latest

# On your VPS / Server:
docker run -d \
  --name tender-backend \
  --restart unless-stopped \
  -p 8080:8080 \
  --env-file .env \
  <your-dockerhub-username>/tender-backend:latest
```

---

## 🛡️ Architecture & Features of this Docker Setup
- **Multi-Stage Build**: Keeps final image size minimal (~150MB) by separating Maven build tools from runtime.
- **Security Best Practices**: Runs as a non-root dedicated `spring` user.
- **JVM Optimization**: G1GC and dynamic container memory management (`-XX:MaxRAMPercentage=75.0`).
- **Automated Healthchecks**: Built-in container health monitoring at `/api/officer/tenders/document-types`.
