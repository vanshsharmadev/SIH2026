# 🏛️ Tender Management Platform & GeM ML Intelligence Backend — Complete API Documentation (v2.0.0)

This document provides exhaustive, end-to-end API documentation for the entire backend ecosystem, including the **Spring Boot Core Gateway**, **Bidder Self-Service & Compliance Engine**, **Officer Procurement & DigiLocker System**, **Node AI RAG Microservice**, and the **13-Endpoint GeM ML Microservice (v2.0.0)**.

---

## 🌐 Base URLs & System Architecture

| Service Component | Local Environment | Production Environment | Description |
| :--- | :--- | :--- | :--- |
| **Spring Boot Core Gateway** | `http://localhost:8080` | `https://sih2026-83r4.onrender.com` | Main REST API Gateway, Security, DB persistence, orchestration |
| **Python GeM ML Microservice** | `http://20.40.44.184` | `http://20.40.44.184` | OCR, pyHanko signatures, live GSTIN verification, Random Forest |
| **Node AI RAG Microservice** | `http://localhost:5000` | `https://sih2026-86kl.onrender.com` | PDF Chunking, Gemini text-embedding-004, pgvector, Gemini 1.5 Pro |
| **Interactive ML Swagger UI** | — | `http://20.40.44.184/docs` | FastAPI Swagger documentation for Python ML microservice |
| **Interactive ML Web Dashboard** | — | `http://20.40.44.184/ui` | Interactive web dashboard for real-time compliance diagnostics |

---

## 📑 Table of Contents

1. [Security, Authentication & Rate Limiting Overview](#1-security-authentication--rate-limiting-overview)
2. [Module 1: Unified Authentication Gateway (`/auth` & `/api/auth`)](#module-1-unified-authentication-gateway-auth--apiauth)
3. [Module 2: Bidder Authentication & Management (`/api/bidder/auth` & `/api/bidder`)](#module-2-bidder-authentication--management-apibidderauth--apibidder)
4. [Module 3: Bidder Compliance Documents & AI Intelligence (`/api/bidder/documents`)](#module-3-bidder-compliance-documents--ai-intelligence-apibidderdocuments)
5. [Module 4: Officer Authentication & DigiLocker Identity (`/api/officer/auth` & `/api/officer/identity`)](#module-4-officer-authentication--digilocker-identity-apiofficerauth--apiofficeridentity)
6. [Module 5: Officer Tender Management & Bidder Comparison (`/api/officer/tenders`)](#module-5-officer-tender-management--bidder-comparison-apiofficertenders)
7. [Module 6: Node AI RAG & Gemini Chatbot Gateway (`/api/ai` & `/api/officer/tenders/...`)](#module-6-node-ai-rag--gemini-chatbot-gateway-apiai--apiofficertenders)
8. [Module 7: GeM ML Microservice v2.0.0 Endpoints (Direct & Proxied)](#module-7-gem-ml-microservice-v200-endpoints-direct--proxied)
9. [Standard Error Responses & Status Codes](#standard-error-responses--status-codes)

---

## 1. Security, Authentication & Rate Limiting Overview

### 1.1 Authentication Scheme
All protected endpoints require a JWT Bearer Token in the HTTP `Authorization` header:
```http
Authorization: Bearer <JWT_TOKEN>
```
* **Algorithm**: HMAC SHA-256 (`HS256`)
* **Token Validity**: 24 Hours (`86,400,000 ms`)
* **Claims**: `sub` (email), `userId`, `role` (`OFFICER` | `BIDDER`), `name`

### 1.2 Access Control Matrix
* **Public Endpoints**: `/auth/**`, `/api/auth/**`, `/api/bidder/auth/**`, `/api/officer/auth/**`, `/api/officer/identity/**`, `/api/bidder/documents/verify-taxpayer`, `/api/bidder/documents/scan-taxpayer`, `/api/bidder/documents/tender-requirements`, `/api/bidder/documents/predict-compliance`, `/api/bidder/documents/batch-audit-files`, `/api/officer/tenders/ml-health`, `/api/officer/tenders/rag-health`, `/api/officer/tenders/document-types`, `/api/officer/tenders/ml/**`, `/api/ai/**`
* **Bidder-Protected (`ROLE_BIDDER`)**: `/api/bidder/documents/**`, `/api/bidder/documents/upload`, `/api/bidder/documents/check-cis`, `/api/bidder/documents/audit-submission`, `/api/bidder/documents/overall-summary`
* **Officer-Protected (`ROLE_OFFICER` or `ROLE_ADMIN`)**: `/api/officer/**`, `/api/officer/tenders/upload`, `/api/officer/tenders`, `/api/officer/tenders/{id}/compare-bidders`, `/api/bidder` (CRUD)

### 1.3 Built-in Rate Limiting (`RateLimiterFilter`)
Strict sliding-window IP rate limiting is enforced on sensitive and auth endpoints:

| Endpoint Path | Max Requests | Window (Seconds) | Action on Exceeded |
| :--- | :--- | :--- | :--- |
| `/api/bidder/auth/login` | **5** | 60 | HTTP 429 Too Many Requests |
| `/api/bidder/auth/signup` | **5** | 60 | HTTP 429 Too Many Requests |
| `/api/bidder/auth/verify-otp` | **5** | 60 | HTTP 429 Too Many Requests |
| `/api/bidder/auth/resend-otp` | **3** | 60 | HTTP 429 Too Many Requests |
| `/api/bidder/auth/forgot-password` | **3** | 60 | HTTP 429 Too Many Requests |
| `/api/bidder/auth/verify-forgot-password-otp` | **5** | 60 | HTTP 429 Too Many Requests |
| `/api/bidder/auth/reset-password` | **5** | 60 | HTTP 429 Too Many Requests |
| `/api/bidder/auth/verify-pan` | **5** | 60 | HTTP 429 Too Many Requests |
| `/api/bidder/auth/verify-gst` | **5** | 60 | HTTP 429 Too Many Requests |
| `/api/bidder/auth/verify-udyam` | **5** | 60 | HTTP 429 Too Many Requests |
| `/api/bidder/auth/verify-business` | **5** | 60 | HTTP 429 Too Many Requests |

* **Rate Limit Rejection Payload (`429 Too Many Requests`)**:
```json
{
  "status": 429,
  "message": "Too many requests. Please try again later."
}
```

---

## Module 1: Unified Authentication Gateway (`/auth` & `/api/auth`)

Controller: `CommonAuthController`  
Routes are accessible under both `/auth/*` and `/api/auth/*`.

### 1.1 Unified Login (Officer or Bidder)
Authenticates credentials against both Officer and Bidder registries, auto-detects user role, and returns unified JWT.
* **Method**: `POST`
* **Route**: `/auth/login` or `/api/auth/login`
* **Auth**: Public
* **Request Body**:
```json
{
  "email": "bidder@example.com",
  "password": "Password@123"
}
```
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJiaWRkZXJAZXhhbXBsZS5jb20iLCJ1c2VySWQiOjEsInJvbGUiOiJCSUVERVIifQ...",
  "user": {
    "id": 1,
    "name": "ACME Infrastructure Pvt Ltd",
    "email": "bidder@example.com",
    "role": "BIDDER"
  }
}
```

### 1.2 Get Authenticated User Profile
Resolves user profile and role from the active Security Context.
* **Method**: `GET`
* **Route**: `/auth/me` or `/api/auth/me`
* **Auth**: `Bearer <TOKEN>`
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Authenticated user profile",
  "user": {
    "id": 1,
    "name": "ACME Infrastructure Pvt Ltd",
    "email": "bidder@example.com",
    "role": "BIDDER"
  }
}
```

### 1.3 Unified / Backward-Compatible Officer Signup
Initiates Officer registration and produces DigiLocker authorization URL.
* **Method**: `POST`
* **Route**: `/auth/signup` or `/api/auth/signup`
* **Request Body**:
```json
{
  "name": "Rajesh Sharma",
  "email": "rajesh.sharma@gov.in",
  "password": "Password@123",
  "department": "Public Works Department",
  "governmentId": "GOV-PWD-2026-9041",
  "phone": "9876543210"
}
```
* **Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Signup initiated. Please verify identity via DigiLocker.",
  "data": {
    "tempToken": "b6a88b1f-7bbf-4d92-b435-08197e4e1a49",
    "verificationUrl": "http://localhost:8080/api/officer/identity/mock-verify?token=b6a88b1f-7bbf-4d92-b435-08197e4e1a49"
  }
}
```

### 1.4 Unified Email OTP Verification
Verifies OTP sent to email and finalizes registration.
* **Method**: `POST`
* **Route**: `/auth/verify-otp` or `/api/auth/verify-otp`
* **Request Body**:
```json
{
  "email": "rajesh.sharma@gov.in",
  "otp": "123456",
  "tempToken": "b6a88b1f-7bbf-4d92-b435-08197e4e1a49"
}
```
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Email verified successfully! Registration complete.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "type": "Bearer",
    "officerId": 1,
    "email": "rajesh.sharma@gov.in",
    "name": "Rajesh Sharma",
    "role": "ROLE_OFFICER"
  }
}
```

### 1.5 Resend OTP
* **Method**: `POST`
* **Route**: `/auth/resend-otp` or `/api/auth/resend-otp`
* **Request Body**:
```json
{
  "email": "rajesh.sharma@gov.in"
}
```

---

## Module 2: Bidder Authentication & Management (`/api/bidder/auth` & `/api/bidder`)

Controller: `BidderAuthController` & `BidderController`

### 2.1 Bidder Registration — Step 1: Initiate Signup
Validates inputs, verifies entity against government database (`bidder_verification`), and dispatches 6-digit OTP via Brevo.
* **Method**: `POST`
* **Route**: `/api/bidder/auth/signup`
* **Auth**: Public
* **Request Body**:
```json
{
  "legalName": "Arnav Tyagi",
  "email": "arnav24169006@gmail.com",
  "gstNumber": "09ARNAV9012H3Z7",
  "phone": "9876500103",
  "password": "Password@123"
}
```
* **Response (`201 Created`)**:
```json
{
  "tempToken": "93162d76aa9141d8950d9e7905ab3d5c",
  "email": "arnav24169006@gmail.com",
  "legalName": "Arnav Tyagi",
  "gstNumber": "09ARNAV9012H3Z7",
  "message": "Bidder verified successfully against government records! Verification OTP sent to arnav24169006@gmail.com"
}
```

### 2.2 Bidder Registration — Step 2: Verify Email OTP
Validates the OTP, persists permanent Bidder entity in PostgreSQL, and generates JWT.
* **Method**: `POST`
* **Route**: `/api/bidder/auth/verify-otp`
* **Request Body**:
```json
{
  "email": "arnav24169006@gmail.com",
  "otp": "123456",
  "tempToken": "93162d76aa9141d8950d9e7905ab3d5c"
}
```
* **Response (`200 OK`)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "bidderId": 1,
  "email": "arnav24169006@gmail.com",
  "legalName": "Arnav Tyagi",
  "phone": "9876500103",
  "gstNumber": "09ARNAV9012H3Z7",
  "isVerified": true,
  "message": "Registration completed successfully! Bidder account created and verified."
}
```

### 2.3 Resend Registration OTP
* **Method**: `POST`
* **Route**: `/api/bidder/auth/resend-otp`
* **Request Body**: `{"email": "arnav24169006@gmail.com"}`

### 2.4 Bidder Login
* **Method**: `POST`
* **Route**: `/api/bidder/auth/login`
* **Request Body**:
```json
{
  "email": "arnav24169006@gmail.com",
  "password": "Password@123"
}
```
* **Response (`200 OK`)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "bidderId": 1,
  "email": "arnav24169006@gmail.com",
  "legalName": "Arnav Tyagi",
  "isVerified": true,
  "message": "Login successful"
}
```

### 2.5 Verify Token (POST & GET)
Supports Bearer header, request body (`{"token":"..."}` or `{"tempToken":"..."}`), and `?token=` query param.
* **Method**: `POST` & `GET`
* **Route**: `/api/bidder/auth/verify-token`
* **Response (`200 OK`)**:
```json
{
  "valid": true,
  "email": "arnav24169006@gmail.com",
  "bidderId": 1,
  "legalName": "Arnav Tyagi",
  "role": "BIDDER",
  "isVerified": true,
  "tokenType": "JWT"
}
```

### 2.6 Authenticated Bidder Profile
* **Method**: `GET`
* **Route**: `/api/bidder/auth/me`
* **Headers**: `Authorization: Bearer <TOKEN>`

### 2.7 Password Reset Flow
1. **Request Reset OTP**: `POST /api/bidder/auth/forgot-password` -> `{"email": "arnav24169006@gmail.com"}`
2. **Verify Reset OTP**: `POST /api/bidder/auth/verify-forgot-password-otp` -> `{"email": "...", "otp": "123456"}`
   * Returns: `{"message": "OTP verified successfully.", "resetToken": "a87fd01c-..."}`
3. **Set New Password**: `POST /api/bidder/auth/reset-password` -> `{"resetToken": "a87fd01c-...", "newPassword": "NewPassword@123"}`

### 2.8 Public Taxpayer ML Pre-Verification
Validates GSTIN / PAN format, structure, and query live GST portal before registration.
* **Method**: `POST`
* **Route**: `/api/bidder/auth/verify-taxpayer-ml`
* **Request Body**:
```json
{
  "identifier": "07AABCB1234F1Z2",
  "identifierType": "gstin",
  "expectedLegalName": "ACME Enterprise",
  "stateCode": "07",
  "useLivePortal": true
}
```

### 2.9 Bidder Management CRUD
* `GET /api/bidder`: Retrieves all registered bidders (Officer/Admin access).
* `GET /api/bidder/{id}`: Retrieves bidder details by ID.
* `PUT /api/bidder/{id}`: Updates bidder details (`legalName`, `phone`, `gstNumber`, `panNumber`).
* `DELETE /api/bidder/{id}`: Deletes bidder account (`204 No Content`).

---

## Module 3: Bidder Compliance Documents & AI Intelligence (`/api/bidder/documents`)

Controller: `BidderDocumentController`  
Handles certificate ingestion to Cloudinary CDN, pyHanko cryptographic verification, pyzbar QR scanning, OCR extraction, and autonomous GFR 173(i) compliance audits.

### 3.1 Upload & Analyze Compliance Certificate
Uploads document (PDF/Image) to Cloudinary, runs ML intake (OCR, entity extraction, digital signature validation, and QR code inspection), and stores record.
* **Method**: `POST`
* **Route**: `/api/bidder/documents/upload`
* **Auth**: `Bearer <BIDDER_TOKEN>`
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  * `file`: `[File attachment: PDF / PNG / JPG]`
  * `documentType`: `gst_certificate` | `pan_card` | `audited_balance_sheet` | `msme_udyam` | `itr_acknowledgment` | `generic`
* **Response (`201 Created`)**:
```json
{
  "id": 14,
  "bidderId": 1,
  "fileName": "gst_registration_cert.pdf",
  "documentType": "gst_certificate",
  "fileUrl": "https://res.cloudinary.com/dxyz/raw/upload/v174152/bidders/gst_registration_cert.pdf",
  "cloudinaryPublicId": "bidders/gst_registration_cert",
  "fileSize": 348192,
  "contentType": "application/pdf",
  "ocrConfidence": 94.2,
  "authenticityScore": 98.0,
  "isAuthentic": true,
  "authenticityVerdict": "AUTHENTIC",
  "verificationFlags": [],
  "rawOcrText": "GOVERNMENT OF INDIA FORM GST REG-06 REGISTRATION CERTIFICATE...",
  "digitalSignatureReport": {
    "has_digital_signature": true,
    "signatures_found": 1,
    "all_signatures_valid": true,
    "signer_name": "GSTN SUB-CA"
  },
  "qrVerificationReport": {
    "qr_codes": [
      {
        "qr_detected": true,
        "qr_type": "gst_portal",
        "qr_content_preview": "07AABCB1234F1Z2|ACTIVE|2018-04-01"
      }
    ]
  },
  "extractedEntities": {
    "gstin": "07AABCB1234F1Z2",
    "legal_name": "ACME ENTERPRISE PVT LTD",
    "registration_date": "2018-04-01"
  },
  "status": "VERIFIED",
  "createdAt": "2026-09-11T08:00:00"
}
```

### 3.2 List All Uploaded Documents
* **Method**: `GET`
* **Route**: `/api/bidder/documents`
* **Auth**: `Bearer <BIDDER_TOKEN>`

### 3.3 Get Single Document Analysis
* **Method**: `GET`
* **Route**: `/api/bidder/documents/{id}`
* **Auth**: `Bearer <BIDDER_TOKEN>`

### 3.4 Delete Document
Removes file from both Cloudinary CDN storage and PostgreSQL database.
* **Method**: `DELETE`
* **Route**: `/api/bidder/documents/{id}`
* **Auth**: `Bearer <BIDDER_TOKEN>`
* **Response**: `204 No Content`

### 3.5 Pre-Submission CIS Self-Check
Calculates Composite Compliance Index (CIS score `0.0 - 1.0`), identifies missing certificates, and predicts qualification likelihood prior to tender submission.
* **Method**: `POST`
* **Route**: `/api/bidder/documents/check-cis`
* **Auth**: `Bearer <BIDDER_TOKEN>`
* **Request Body**:
```json
{
  "tenderType": "goods",
  "requiredDocuments": ["pan_card", "gst_certificate", "audited_balance_sheet"]
}
```
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "cisScore": 0.94,
  "riskClassification": "low_risk",
  "clearanceEligibility": "ELIGIBLE_SINGLE_CLICK",
  "documentsAnalyzed": 3,
  "missingDocuments": [],
  "componentScores": {
    "mandatory_coverage": 1.0,
    "authenticity_index": 0.98,
    "field_validity": 0.92,
    "financial_ratio": 1.0
  },
  "recommendations": [
    "All criteria validated. High probability of Single-Click Automated Tender Clearance!"
  ],
  "summary": "Calculated via ML Composite Compliance Index Engine (v2.0.0)."
}
```

### 3.6 Instant Taxpayer Document Scanner
Uploads a PAN or GST document, runs OCR, cross-validates identifiers, and queries the live GST portal.
* **Method**: `POST`
* **Route**: `/api/bidder/documents/scan-taxpayer`
* **Auth**: Public
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  * `file`: `[Document attachment]`
  * `useLivePortal`: `true`

### 3.7 Live Taxpayer Identifier Verification
* **Method**: `POST`
* **Route**: `/api/bidder/documents/verify-taxpayer`
* **Auth**: Public
* **Request Body**:
```json
{
  "identifier": "07AABCB1234F1Z2",
  "identifierType": "gstin",
  "expectedLegalName": "ACME Enterprise",
  "useLivePortal": true
}
```

### 3.8 Master Autonomous Audit for Bidder
Audits all uploaded compliance certificates against tender specification with GFR 173(i) MSE/Startup waivers.
* **Method**: `POST`
* **Route**: `/api/bidder/documents/audit-submission`
* **Auth**: `Bearer <BIDDER_TOKEN>`
* **Request Body**:
```json
{
  "tender_specification": {
    "tender_type": "goods",
    "required_categories": ["pan_card", "gst_certificate", "msme_udyam"],
    "min_turnover_inr": 5000000.0
  },
  "bidder_profile": {
    "is_msme": true,
    "is_startup": false,
    "annual_turnover": 4500000.0
  }
}
```

### 3.9 Batch Upload Autonomous Audit for Bidder
Uploads multiple certificates and tender NIT notice simultaneously for complete forensic and qualification audit.
* **Method**: `POST`
* **Route**: `/api/bidder/documents/batch-audit-files`
* **Auth**: Public
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  * `files`: `[Certificate 1]`
  * `files`: `[Certificate 2]`
  * `tender_file`: `[Tender Notice NIT]` *(optional)*
  * `is_msme`: `true`
  * `is_startup`: `false`

### 3.10 Bidder Dossier & Pre-Chunked RAG Markdown
Generates comprehensive audit summary and pre-chunked markdown text for Gemini LLM context injection.
* **Method**: `GET`
* **Route**: `/api/bidder/documents/overall-summary?tender_type=goods&use_live_portal=true&include_rag_context=true`
* **Auth**: `Bearer <BIDDER_TOKEN>`

### 3.11 Dynamic Tender Requirements Parsing
Parses tender text into a 6-pillar compliance checklist, detecting GFR 173(i) exemptions.
* **Method**: `POST`
* **Route**: `/api/bidder/documents/tender-requirements`
* **Auth**: Public
* **Request Body**:
```json
{
  "tender_type": "works",
  "tender_text": "Mandatory: PAN, GST, 3 Years Balance Sheet, EMD INR 50000",
  "is_msme": true
}
```

### 3.12 Random Forest Compliance Verdict Predictor
* **Method**: `POST`
* **Route**: `/api/bidder/documents/predict-compliance`
* **Auth**: Public
* **Request Body**:
```json
{
  "feature_dict": {
    "raw_cis_score": 0.95,
    "mandatory_coverage_ratio": 1.0,
    "authenticity_score": 0.98,
    "financial_ratio": 1.0,
    "statutory_tax_score": 1.0,
    "past_performance_score": 0.9,
    "is_fake_detected": 0.0,
    "tampering_detected": 0.0,
    "msme_exemption_boost": 0.0
  }
}
```

---

## Module 4: Officer Authentication & DigiLocker Identity (`/api/officer/auth` & `/api/officer/identity`)

Controller: `OfficerAuthController`  
Routes are identically registered under both `/api/officer/auth/*` and `/api/officer/identity/*`.

### 4.1 Officer Registration — Step 1: Signup & Initiate DigiLocker
* **Method**: `POST`
* **Route**: `/api/officer/auth/signup` (or `/api/officer/identity/signup`)
* **Request Body**:
```json
{
  "name": "Dr. Sunita Rao",
  "email": "sunita.rao@pwd.delhi.gov.in",
  "password": "Password@123",
  "department": "Public Works Department",
  "governmentId": "DL-PWD-OFF-8821",
  "phone": "9811223344"
}
```
* **Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Signup initiated. Please verify identity via DigiLocker.",
  "data": {
    "tempToken": "7b89d421-41ee-48c2-a42e-13c88019ab54",
    "verificationUrl": "http://localhost:8080/api/officer/identity/mock-verify?token=7b89d421-41ee-48c2-a42e-13c88019ab54"
  }
}
```

### 4.2 Explicit Initiate Identity Verification
* **Method**: `POST`
* **Route**: `/api/officer/auth/initiate` (or `/api/officer/identity/initiate`)
* **Request Body**: `{"tempToken": "7b89d421-41ee-48c2-a42e-13c88019ab54"}`

### 4.3 Mock DigiLocker Identity Authorization (POST & GET)
Simulates DigiLocker MeriPehchaan OAuth authorization, performs fuzzy name matching against government registry, and triggers email OTP dispatch upon successful match.
* **Method**: `POST` & `GET`
* **Route**: `/api/officer/auth/mock-verify` (or `/api/officer/identity/mock-verify`, `/mock-login`)
* **POST Request Body**:
```json
{
  "tempToken": "7b89d421-41ee-48c2-a42e-13c88019ab54",
  "aadhaarNumber": "999988887777",
  "panNumber": "ABCDE1234F"
}
```
* **GET via URL**: `GET /api/officer/identity/mock-verify?token=7b89d421-41ee-48c2-a42e-13c88019ab54`
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Identity verified successfully",
  "data": {
    "tempToken": "7b89d421-41ee-48c2-a42e-13c88019ab54",
    "status": "IDENTITY_VERIFIED",
    "nameMatchScore": 100.0,
    "otpSent": true,
    "message": "DigiLocker verification successful. Verification OTP sent to registered email."
  }
}
```

### 4.4 Verify Email OTP & Complete Officer Registration
* **Method**: `POST`
* **Route**: `/api/officer/auth/verify-otp` (or `/api/officer/identity/verify-otp`)
* **Request Body**:
```json
{
  "email": "sunita.rao@pwd.delhi.gov.in",
  "otp": "123456",
  "tempToken": "7b89d421-41ee-48c2-a42e-13c88019ab54"
}
```
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Email verified successfully! Registration complete.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "type": "Bearer",
    "officerId": 3,
    "email": "sunita.rao@pwd.delhi.gov.in",
    "name": "Dr. Sunita Rao",
    "role": "ROLE_OFFICER"
  }
}
```

### 4.5 Resend Email OTP
* **Method**: `POST`
* **Route**: `/api/officer/auth/resend-otp` (or `/api/officer/identity/resend-otp`)
* **Request Body**: `{"email": "sunita.rao@pwd.delhi.gov.in"}`

### 4.6 Officer Login
* **Method**: `POST`
* **Route**: `/api/officer/auth/login` (or `/api/officer/identity/login`)
* **Request Body**:
```json
{
  "email": "sunita.rao@pwd.delhi.gov.in",
  "password": "Password@123"
}
```
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Officer authenticated successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "type": "Bearer",
    "officerId": 3,
    "email": "sunita.rao@pwd.delhi.gov.in",
    "name": "Dr. Sunita Rao",
    "role": "ROLE_OFFICER"
  }
}
```

### 4.7 Get Authenticated Officer Profile
* **Method**: `GET`
* **Route**: `/api/officer/auth/me` (or `/api/officer/identity/me`)
* **Headers**: `Authorization: Bearer <OFFICER_TOKEN>`

---

## Module 5: Officer Tender Management & Bidder Comparison (`/api/officer/tenders`)

Controller: `OfficerTenderController`  
Implements parallel ingestion: saves tender to Cloudinary CDN, executes Python ML OCR/Taxonomy analysis and Node AI RAG vector embedding indexing in parallel, then persists into PostgreSQL.

### 5.1 Upload & Ingest Tender Notice (Parallel Processing Pipeline)
* **Method**: `POST`
* **Route**: `/api/officer/tenders/upload`
* **Auth**: `Bearer <OFFICER_TOKEN>`
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  * `file`: `[Tender Notice PDF]`
  * `title`: `Construction of 6-Lane Expressway Corridor`
  * `description`: `NHAI Highway Tender with EMD and Minimum Turnover Criteria`
  * `documentType`: `tender_notice` *(or `other`)*
* **Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Tender document uploaded and analyzed successfully",
  "data": {
    "tenderId": 5,
    "title": "Construction of 6-Lane Expressway Corridor",
    "fileUrl": "https://res.cloudinary.com/dxyz/raw/upload/v174152/tenders/expressway_nit.pdf",
    "documentType": "tender_notice",
    "ocrConfidence": 96.5,
    "authenticityScore": 99.0,
    "extractedEntities": {
      "tender_ref_no": "NHAI/2026/EXP/094",
      "estimated_cost": "INR 150 Crores",
      "emd_amount": "INR 50 Lakhs",
      "min_turnover": "INR 30 Crores",
      "deadline": "2026-10-15"
    },
    "ragIndexed": true,
    "createdAt": "2026-09-11T08:00:00"
  }
}
```

### 5.2 List Officer Tenders
* **Method**: `GET`
* **Route**: `/api/officer/tenders`
* **Auth**: `Bearer <OFFICER_TOKEN>`

### 5.3 Get Tender Details by ID
* **Method**: `GET`
* **Route**: `/api/officer/tenders/{id}`
* **Auth**: `Bearer <OFFICER_TOKEN>`

### 5.4 Compare Bidders against Tender Criteria (AI Evaluation)
* **Method**: `POST`
* **Route**: `/api/officer/tenders/{id}/compare-bidders`
* **Auth**: `Bearer <OFFICER_TOKEN>`
* **Request Body**:
```json
{
  "bidders_data": [
    {
      "bidder_id": 1,
      "bidder_name": "Larsen & Toubro Construction",
      "bid_amount": 142000000.0,
      "experience_years": 15,
      "financial_rating": "AAA",
      "is_msme": false
    },
    {
      "bidder_id": 2,
      "bidder_name": "Afcons Infrastructure Ltd",
      "bid_amount": 148000000.0,
      "experience_years": 12,
      "financial_rating": "AA+",
      "is_msme": false
    }
  ],
  "tender_requirements": {
    "max_budget": 150000000.0,
    "min_experience_years": 10,
    "min_turnover": 50000000.0
  }
}
```
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Bidder comparison completed successfully",
  "data": {
    "tenderId": 5,
    "recommended_bidder_id": 1,
    "bidders_ranking": [
      {
        "rank": 1,
        "bidder_id": 1,
        "bidder_name": "Larsen & Toubro Construction",
        "composite_score": 0.94,
        "verdict": "RECOMMENDED_L1"
      }
    ]
  }
}
```

---

## Module 6: Node AI RAG & Gemini Chatbot Gateway (`/api/ai` & `/api/officer/tenders/...`)

Controllers: `OfficerTenderController` & `NodeRagProxyController`  
Backend Service: `https://sih2026-86kl.onrender.com` (Google Gemini `text-embedding-004`, Neon `pgvector`, Gemini 1.5 Pro).

### 6.1 Ask Bidder-Tender Chatbot (Specific Tender ID in Path)
Submits procurement officer query to RAG pipeline. The service semantically retrieves indexed tender requirements, bidder submission documents, and ML compliance audit summaries, formatting a factual response with exact citations.
* **Method**: `POST`
* **Route**: `/api/officer/tenders/{id}/chat`
* **Auth**: `Bearer <OFFICER_TOKEN>` (or Public in security configuration)
* **Request Body**:
```json
{
  "bidderId": "BID-007",
  "query": "Does this bidder satisfy the turnover and past work experience requirement?"
}
```
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Chatbot response generated successfully",
  "data": {
    "answer": "Yes, bidder BID-007 satisfies both criteria. As per the uploaded Audited Balance Sheet FY2024-25 (Page 4), the verified average annual turnover is INR 14.5 Crores (exceeding the required INR 10 Crores). Furthermore, past completion certificates confirm execution of 3 similar civil road construction projects between 2022 and 2025.",
    "sources": [
      {
        "documentType": "FINANCIAL_STATEMENT",
        "fileName": "audited_balance_sheet_2025.pdf",
        "pageNumber": 4,
        "matchedSnippet": "Average Annual Turnover (3 Years): INR 14,50,00,000"
      },
      {
        "documentType": "TENDER_SPEC",
        "section": "Clause 3.1 - Financial Eligibility",
        "matchedSnippet": "Minimum Average Annual Turnover: INR 10,00,00,000"
      }
    ],
    "tenderId": "5",
    "bidderId": "BID-007",
    "query": "Does this bidder satisfy the turnover and past work experience requirement?"
  }
}
```

### 6.2 Ask Chatbot (General Request Body Endpoint)
* **Method**: `POST`
* **Route**: `/api/officer/tenders/chat`
* **Request Body**:
```json
{
  "tenderId": "5",
  "bidderId": "BID-007",
  "query": "Evaluate GST compliance and indicate any potential fraud or blacklisting flags."
}
```

### 6.3 Node AI RAG Service Health Check
* **Method**: `GET`
* **Route**: `/api/officer/tenders/rag-health` or `/api/officer/tenders/chat/health` or `/api/ai/health`
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Node AI RAG Service health status",
  "data": {
    "status": "UP",
    "service": "node-ai-rag-service",
    "vectorDatabase": "pgvector (Neon DB)",
    "embeddingModel": "text-embedding-004",
    "llmModel": "gemini-1.5-pro"
  }
}
```

### 6.4 Direct Proxy Ingestion: Tender PDF Chunking & Vectorization
* **Method**: `POST`
* **Route**: `/api/ai/tender/process`
* **Request Body**:
```json
{
  "tenderId": "5",
  "title": "Expressway Tender NIT",
  "pdfUrl": "https://res.cloudinary.com/dxyz/raw/upload/v174152/tenders/nit.pdf",
  "publicId": "tenders/nit"
}
```

### 6.5 Direct Proxy Ingestion: Bidder Document Chunking & Vectorization
* **Method**: `POST`
* **Route**: `/api/ai/bidder/process`
* **Request Body**:
```json
{
  "tenderId": "5",
  "bidderId": "1",
  "documentId": "14",
  "documentType": "gst_certificate",
  "pdfUrl": "https://res.cloudinary.com/dxyz/raw/upload/v174152/bidders/gst.pdf",
  "publicId": "bidders/gst"
}
```

### 6.6 Direct Proxy Chatbot Query
* **Method**: `POST`
* **Route**: `/api/ai/bidder-tender-chat/ask`
* **Request Body**:
```json
{
  "tenderId": "5",
  "bidderId": "1",
  "query": "Summarize all compliance strengths and deficiencies for bidder 1."
}
```

---

## Module 7: GeM ML Microservice v2.0.0 Endpoints (Direct & Proxied)

Direct Base URL: `http://20.40.44.184`  
Spring Boot Proxy Base URL: `/api/officer/tenders/...`

All 13 endpoints can be called directly on the Python FastAPI service or proxied through Spring Boot.

### 1. Interactive Dashboard & Swagger
* **Direct ML Routes**:
  * `GET http://20.40.44.184/` or `GET http://20.40.44.184/ui` (Web UI Dashboard)
  * `GET http://20.40.44.184/docs` (Interactive OpenAPI Swagger UI)

### 2. Unified Health & Live GST Portal Check
* **Spring Boot Route**: `GET /api/officer/tenders/ml-health`
* **Direct ML Route**: `GET http://20.40.44.184/health`
* **Response (`200 OK`)**:
```json
{
  "status": "healthy",
  "service": "gem-ml-service",
  "version": "2.0.0",
  "gst_portal": {
    "portal": "https://services.gst.gov.in/services/searchtp",
    "reachable": true,
    "status_code": 200,
    "status": "active",
    "response_time_ms": 204
  }
}
```

### 3. Procurement Document Taxonomy & Compliance Weights (18 Categories)
* **Spring Boot Route**: `GET /api/officer/tenders/document-types`
* **Direct ML Route**: `GET http://20.40.44.184/api/ml/document-types`
* Returns complete taxonomy spanning Statutory Tax (`pan_card`, `gst_certificate`), Financial Standing (`audited_balance_sheet`, `turnover_certificate`, `net_worth_certificate`), Technical Capacity (`past_experience_certificate`, `performance_certificate`), Legal Standing (`incorporation_certificate`, `power_of_attorney`), Preferential Status (`msme_udyam`, `startup_india_dpiit`), and Tender-Specific instruments (`emd_guarantee`, `integrity_pact`).

### 4. Single-File Consolidated Intake (OCR + NER + Forgery + Digital Signatures)
* **Spring Boot Route**: `POST /api/officer/tenders/ml/process-document`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/process-document`
* **Content-Type**: `multipart/form-data`
* **Parameters**: `file` (binary), `document_type` (e.g. `pan_card`), `full_analysis` (`true`)

### 5. Master Autonomous Tender Audit (JSON Intake)
* **Spring Boot Route**: `POST /api/officer/tenders/ml/automate-all`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/automate-all`
* **Content-Type**: `application/json`
* **Request Body**:
```json
{
  "documents": [
    {
      "document_type": "pan_card",
      "ocr_text": "INCOME TAX DEPARTMENT GOVT OF INDIA ABCDE1234F",
      "entities": { "pan": "ABCDE1234F", "name": "ACME ENTERPRISE" }
    },
    {
      "document_type": "gst_certificate",
      "ocr_text": "GOVERNMENT OF INDIA FORM GST REG-06 07ABCDE1234F1Z5",
      "entities": { "gstin": "07ABCDE1234F1Z5", "legal_name": "ACME ENTERPRISE" }
    }
  ],
  "tender_specification": {
    "tender_type": "goods",
    "required_categories": ["pan_card", "gst_certificate"]
  },
  "bidder_profile": {
    "is_msme": true,
    "is_startup": false,
    "annual_turnover": 4500000.0
  }
}
```

### 6. Master Multipart Batch File Upload Autonomous Audit
* **Spring Boot Route**: `POST /api/officer/tenders/ml/automate-all-files`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/automate-all-files`
* **Content-Type**: `multipart/form-data`
* **Parameters**: `files` (multi), `tender_file` (optional NIT file), `is_msme` (`true`), `is_startup` (`false`)

### 7. Consolidated Dossier & Pre-Chunked RAG Synthesis
* **Spring Boot Route**: `GET /api/officer/tenders/ml/overall-summary?bid_id=GEM/2026/B/894721&identifier=07AABCB1234F1Z2&tender_type=goods&use_live_portal=false&include_rag_context=true`
* **Direct ML Route**: `GET http://20.40.44.184/api/ml/overall-summary?...`

### 8. Unified Forensic Verification & Anti-Tampering (pyHanko + QR + Stamps)
* **Spring Boot Route**: `POST /api/officer/tenders/ml/verify-document`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/verify-document`
* **Modes Supported**:
  1. **Multipart File Upload**: `file` (binary), `doc_type`, `auto_ocr=true`
  2. **JSON Tampering Evaluation**: `{"document_text": "...", "qr_payload": "...", "doc_type": "pan"}`

### 9. Unified Statutory Taxpayer Verification (GSTIN, PAN, UIN)
* **Spring Boot Route**: `POST /api/officer/tenders/ml/verify-taxpayer`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/verify-taxpayer`
* **Request Body**:
```json
{
  "identifier": "07AABCB1234F1Z2",
  "identifier_type": "gstin",
  "state_code": "07",
  "use_live_portal": true
}
```

### 10. Dynamic Tender Requirements Parsing & 6-Pillar Checklist
* **Spring Boot Route**: `POST /api/officer/tenders/ml/tender-requirements`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/tender-requirements`
* **Request Body**:
```json
{
  "tender_type": "works",
  "tender_text": "Mandatory certificates: PAN Card, GST Registration, Audited Balance Sheet 3 years, EMD Rs 50,000",
  "is_msme": true
}
```

### 11. Procurement Clearance Decision Engine
* **Spring Boot Route**: `POST /api/officer/tenders/ml/process-clearance`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/process-clearance`
* **Request Body**:
```json
{
  "cis_score": 0.96,
  "authenticity_score": 95.0,
  "risk_level": "low_risk"
}
```

### 12. Direct Machine Learning Compliance Verdict & Score Predictor
* **Spring Boot Route**: `POST /api/officer/tenders/ml/compliance-predict`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/compliance/predict`
* **Request Body**:
```json
{
  "feature_dict": {
    "raw_cis_score": 0.95,
    "mandatory_coverage_ratio": 1.0,
    "authenticity_score": 0.98,
    "financial_ratio": 1.0,
    "statutory_tax_score": 1.0,
    "past_performance_score": 0.9,
    "is_fake_detected": 0.0,
    "tampering_detected": 0.0,
    "msme_exemption_boost": 0.0
  }
}
```

### 13. Unified Machine Learning Retraining Pipeline
* **Spring Boot Route**: `POST /api/officer/tenders/ml/train-all`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/train/all`
* **Request Body**:
```json
{
  "retrain_all": true,
  "classifier_epochs": 10
}
```

---

## Standard Error Responses & Status Codes

All API endpoints follow standard HTTP status codes and unified JSON error envelopes.

### HTTP Status Code Summary
| Code | Meaning | Cause |
| :--- | :--- | :--- |
| `200 OK` | Success | Request succeeded and body returned |
| `201 Created` | Created | Resource created (e.g., signup initiation, file upload) |
| `204 No Content` | No Content | Resource deleted successfully |
| `400 Bad Request` | Validation Failure | Invalid request payload or missing required parameter |
| `401 Unauthorized` | Unauthorized | Missing, expired, or invalid JWT Bearer token |
| `403 Forbidden` | Forbidden | Insufficient role permissions or unverified account |
| `404 Not Found` | Not Found | Resource ID does not exist in database |
| `409 Conflict` | Conflict | Duplicate record (e.g., email or GSTIN already registered) |
| `429 Too Many Requests` | Rate Limit Exceeded | Sliding window request rate limit exceeded |
| `500 Internal Server Error` | Server Error | Uncaught server exception or downstream service failure |

### Validation Error Envelope (`400 Bad Request`)
```json
{
  "success": false,
  "status": 400,
  "error": "Validation Failed",
  "message": "Validation failed for 2 field(s)",
  "errors": {
    "email": "Email must be a valid email address",
    "password": "Password must be at least 8 characters long"
  }
}
```

### Unauthorized Error Envelope (`401 Unauthorized`)
```json
{
  "success": false,
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource"
}
```

### Conflict Error Envelope (`409 Conflict`)
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Bidder already exists with email: bidder@example.com",
  "path": "/api/bidder/auth/signup"
}
```
