# 🏛️ Tender Management Platform - Complete API Documentation (v2.0.0)

**Backend Base URL (Local)**: `http://localhost:8080`  
**Backend Base URL (Production)**: `https://sih2026-83r4.onrender.com`  
**Python ML Microservice (v2.0.0)**: `http://20.40.44.184`  
**Interactive Swagger UI**: `http://20.40.44.184/docs`  
**Interactive Dashboard**: `http://20.40.44.184/ui`  

---

## 📑 Table of Contents
1. [Security & Authentication Overview](#1-security--authentication-overview)
2. [Bidder Module APIs](#2-bidder-module-apis)
3. [Officer Authentication & DigiLocker APIs](#3-officer-authentication--digilocker-apis)
4. [Tender Management & Cloudinary APIs](#4-tender-management--cloudinary-apis)
5. [GeM ML Microservice v2.0.0 APIs (13 Consolidated Endpoints)](#5-gem-ml-microservice-v200-apis-13-consolidated-endpoints)

---

## 1. Security & Authentication Overview
- **Authentication Scheme**: JWT Bearer Token (`Authorization: Bearer <JWT_TOKEN>`)
- **Token Validity**: 24 Hours (`86400000 ms`)
- **Public Routes**: `/api/bidder/auth/**`, `/api/officer/auth/**`, `/api/officer/tenders/ml-health`, `/api/officer/tenders/document-types`

---

## 2. Bidder Module APIs

### 2.1 Bidder Signup
Initiates bidder signup by checking duplicates and verifying against government records (`bidder_verification` table), and dispatches a 6-digit OTP to the verified email via Brevo.
* **Method**: `POST`
* **Route**: `/api/bidder/auth/signup`
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

---

### 2.2 Verify Email OTP & Finalize Registration
Validates OTP, creates permanent bidder account, and issues JWT Bearer token.
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

---

### 2.3 Resend OTP
* **Method**: `POST`
* **Route**: `/api/bidder/auth/resend-otp`
* **Request Body**:
```json
{
  "email": "arnav24169006@gmail.com"
}
```

---

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

---

### 2.5 Get Authenticated Bidder Profile
* **Method**: `GET`
* **Route**: `/api/bidder/auth/me`
* **Headers**: `Authorization: Bearer <TOKEN>`

---

### 2.6 Forgot Password & Reset Password
* `POST /api/bidder/auth/forgot-password` -> `{"email": "..."}`
* `POST /api/bidder/auth/verify-forgot-password-otp` -> `{"email": "...", "otp": "..."}` (Returns `resetToken`)
* `POST /api/bidder/auth/reset-password` -> `{"resetToken": "...", "newPassword": "..."}`

---

## 3. Officer Authentication & DigiLocker APIs

### 3.1 Officer Login
* **Method**: `POST`
* **Route**: `/api/officer/auth/login`
* **Request Body**:
```json
{
  "email": "officer@pwd.gov.in",
  "password": "Password@123"
}
```

### 3.2 Verify Officer Token
* **Method**: `POST`
* **Route**: `/api/officer/auth/verify-token`
* **Headers**: `Authorization: Bearer <TOKEN>`

### 3.3 DigiLocker OAuth Verification
* `GET /api/officer/auth/digilocker/initiate` -> Generates OAuth authorization URL
* `GET /api/officer/auth/digilocker/callback?code=...` -> OAuth token exchange & Aadhaar/Gov ID validation

---

## 4. Tender Management & Cloudinary APIs

### 4.1 Upload & Process Tender Document
Uploads tender PDF/Image to Cloudinary, runs single-call ML intake, and saves metadata into PostgreSQL.
* **Method**: `POST`
* **Route**: `/api/officer/tenders/upload`
* **Headers**: `Authorization: Bearer <OFFICER_TOKEN>`
* **Body Type**: `multipart/form-data`
  * `file`: `[Select PDF / Image file]`
  * `title`: `Construction of Elevated Expressway Corridor`
  * `description`: `National Highway 6-lane elevated expressway tender`
  * `documentType`: `tender_notice` *(or `other`)*

---

### 4.2 Get Officer Tenders
* **Method**: `GET`
* **Route**: `/api/officer/tenders`
* **Headers**: `Authorization: Bearer <OFFICER_TOKEN>`

---

### 4.3 Get Specific Tender by ID
* **Method**: `GET`
* **Route**: `/api/officer/tenders/{id}`
* **Headers**: `Authorization: Bearer <OFFICER_TOKEN>`

---

### 4.4 Compare Bidders against Tender Requirements
* **Method**: `POST`
* **Route**: `/api/officer/tenders/{id}/compare-bidders`
* **Headers**: `Authorization: Bearer <OFFICER_TOKEN>`, `Content-Type: application/json`
* **Request Body**:
```json
{
  "bidders_data": [
    {
      "bidder_id": 1,
      "bidder_name": "L&T Construction",
      "bid_amount": 142000000,
      "experience_years": 15,
      "financial_rating": "AAA"
    },
    {
      "bidder_id": 2,
      "bidder_name": "Afcons Infrastructure",
      "bid_amount": 148000000,
      "experience_years": 12,
      "financial_rating": "AA+"
    }
  ],
  "tender_requirements": {
    "max_budget": 150000000,
    "min_experience_years": 10
  }
}
```

---

## 5. GeM ML Microservice v2.0.0 APIs (13 Consolidated Endpoints)

All endpoints can be called directly on Python ML Service (`http://20.40.44.184`) or through Spring Boot (`/api/officer/tenders/...`).

### 1. Interactive Dashboard
* **Route**: `GET http://20.40.44.184/` or `GET http://20.40.44.184/ui`

---

### 2. Unified Health & Live GST Portal Check
* **Spring Boot Route**: `GET /api/officer/tenders/ml-health`
* **Direct ML Route**: `GET http://20.40.44.184/health`
* **Response**:
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

---

### 3. Procurement Document Taxonomy & Weights (18 Categories)
* **Spring Boot Route**: `GET /api/officer/tenders/document-types`
* **Direct ML Route**: `GET http://20.40.44.184/api/ml/document-types`

---

### 4. Single-File Consolidated Intake (OCR + Classification + NER + Forgery)
* **Spring Boot Route**: `POST /api/officer/tenders/ml/process-document`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/process-document`
* **Content-Type**: `multipart/form-data`
* **Form-Data**:
  * `file`: `[Select File]`
  * `document_type`: `pan_card` *(optional)*
  * `full_analysis`: `true`

---

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

---

### 6. Master Multipart Batch File Upload Autonomous Audit
* **Spring Boot Route**: `POST /api/officer/tenders/ml/automate-all-files`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/automate-all-files`
* **Content-Type**: `multipart/form-data`
* **Form-Data**:
  * `files`: `[Select File 1]`
  * `files`: `[Select File 2]`
  * `tender_file`: `[Select Tender NIT File]` *(optional)*
  * `is_msme`: `true`
  * `is_startup`: `false`

---

### 7. Consolidated Single-GET Comprehensive Dossier & RAG Synthesis
* **Spring Boot Route**: `GET /api/officer/tenders/ml/overall-summary?bid_id=GEM/2026/B/894721&identifier=07AABCB1234F1Z2`
* **Direct ML Route**: `GET http://20.40.44.184/api/ml/overall-summary?bid_id=GEM/2026/B/894721&identifier=07AABCB1234F1Z2`

---

### 8. Unified Forensic Verification & Anti-Tampering (pyHanko + QR + Stamps)
* **Spring Boot Route**: `POST /api/officer/tenders/ml/verify-document`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/verify-document`
* **Supports**:
  - **Multipart File Upload**: `file`, `doc_type`, `auto_ocr=true`
  - **JSON Card Tampering**: `{"document_text": "...", "qr_payload": "...", "doc_type": "pan"}`

---

### 9. Unified Statutory Taxpayer Verification (GSTIN, PAN, UIN)
* **Spring Boot Route**: `POST /api/officer/tenders/ml/verify-taxpayer`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/verify-taxpayer`
* **Request Body**:
```json
{
  "identifier": "07AABCB1234F1Z2",
  "identifier_type": "gstin",
  "use_live_portal": true
}
```

---

### 10. Dynamic Tender Requirements Parsing & 6-Pillar Checklist
* **Spring Boot Route**: `POST /api/officer/tenders/ml/tender-requirements`
* **Direct ML Route**: `POST http://20.40.44.184/api/ml/tender-requirements`
* **Request Body**:
```json
{
  "tender_type": "works",
  "tender_text": "Required Documents: PAN Card, GST Registration, Audited Balance Sheet for 3 years, EMD of Rs 50,000",
  "is_msme": true
}
```

---

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

---

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

---

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
