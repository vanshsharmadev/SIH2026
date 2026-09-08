# 🏛️ Tender Management Platform - API Documentation

**Base URL**: `http://localhost:8080`  
**Environment**: Development / Production (Neon PostgreSQL + Brevo Email Service + DigiLocker Integration)

---

## 📑 Table of Contents
1. [Overview & Authentication](#1-overview--authentication)
2. [Bidder Authentication & Verification APIs](#2-bidder-authentication--verification-apis)
3. [Bidder Profile Management APIs](#3-bidder-profile-management-apis)
4. [Officer Authentication & DigiLocker APIs](#4-officer-authentication--digilocker-apis)
5. [Error Handling & Status Codes](#5-error-handling--status-codes)

---

## 1. Overview & Authentication

### Security Model
- **Public Endpoints**: `/api/bidder/auth/**`, `/api/officer/auth/**`, `/api/officer/identity/**`, `/api/auth/**`
- **Protected Endpoints**: Require HTTP Header `Authorization: Bearer <JWT_TOKEN>`
- **Token Validity**: 24 Hours (`86400000 ms`)

---

## 2. Bidder Authentication & Verification APIs

### 2.1 Bidder Signup
Initiates bidder signup by verifying the details against official government records (`bidder_verification` table) and dispatches an OTP to the verified email.

- **Method**: `POST`
- **Endpoint**: `/api/bidder/auth/signup`
- **Auth Required**: No

#### Request Body
```json
{
  "legalName": "Arnav Tyagi",
  "email": "arnav24169006@gmail.com",
  "gstNumber": "09ARNAV9012H3Z7",
  "phone": "9876500103",
  "password": "Password@123"
}
```

#### Response (`201 Created`)
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

### 2.2 Verify Email OTP
Validates the 6-digit OTP sent to the bidder's email, creates the permanent bidder record, and returns a JWT authentication token.

- **Method**: `POST`
- **Endpoint**: `/api/bidder/auth/verify-otp`
- **Auth Required**: No

#### Request Body (Option A - Using Email)
```json
{
  "email": "arnav24169006@gmail.com",
  "otp": "123456"
}
```

#### Request Body (Option B - Using Temp Token)
```json
{
  "tempToken": "93162d76aa9141d8950d9e7905ab3d5c",
  "otp": "123456"
}
```

#### Response (`200 OK`)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

### 2.3 Resend Verification OTP
Resends a fresh 6-digit OTP to the bidder's registered email address.

- **Method**: `POST`
- **Endpoint**: `/api/bidder/auth/resend-otp`
- **Auth Required**: No

#### Request Body
```json
{
  "email": "arnav24169006@gmail.com"
}
```

#### Response (`200 OK`)
```json
{
  "message": "A fresh OTP has been sent to arnav24169006@gmail.com"
}
```

---

### 2.4 Bidder Login
Authenticates an existing verified bidder and issues a JWT token.

- **Method**: `POST`
- **Endpoint**: `/api/bidder/auth/login`
- **Auth Required**: No

#### Request Body
```json
{
  "email": "arnav24169006@gmail.com",
  "password": "Password@123"
}
```

#### Response (`200 OK`)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "bidderId": 1,
  "email": "arnav24169006@gmail.com",
  "legalName": "Arnav Tyagi",
  "phone": "9876500103",
  "gstNumber": "09ARNAV9012H3Z7",
  "isVerified": true,
  "message": "Bidder logged in successfully!"
}
```

---

### 2.5 Verify Token (JWT or Temp Token)
Validates whether a given token (`JWT Auth Token` or `tempToken`) is active and valid, returning user session details.

- **Method**: `POST` or `GET`
- **Endpoint**: `/api/bidder/auth/verify-token`
- **Auth Required**: Optional (Accepts Header `Authorization: Bearer <token>`, JSON body `{"token":"..."}`, or `?token=...` param)

#### Request Body (POST)
```json
{
  "token": "93162d76aa9141d8950d9e7905ab3d5c"
}
```

#### Response (`200 OK` - Temp Token)
```json
{
  "valid": true,
  "tokenType": "TEMP_TOKEN",
  "email": "arnav24169006@gmail.com",
  "legalName": "Arnav Tyagi",
  "gstNumber": "09ARNAV9012H3Z7",
  "phone": "9876500103",
  "isVerified": false,
  "message": "Temporary registration token is valid and active."
}
```

#### Response (`200 OK` - JWT Bearer Token)
```json
{
  "valid": true,
  "tokenType": "JWT",
  "bidderId": 1,
  "email": "arnav24169006@gmail.com",
  "legalName": "Arnav Tyagi",
  "gstNumber": "09ARNAV9012H3Z7",
  "phone": "9876500103",
  "isVerified": true,
  "message": "JWT token is valid and active."
}
```

---

### 2.6 Get Current Bidder Profile (`/me`)
Fetches the profile details of the logged-in bidder.

- **Method**: `GET`
- **Endpoint**: `/api/bidder/auth/me`
- **Auth Required**: Yes (`Authorization: Bearer <JWT_TOKEN>`)

#### Response (`200 OK`)
```json
{
  "valid": true,
  "tokenType": "JWT",
  "bidderId": 1,
  "email": "arnav24169006@gmail.com",
  "legalName": "Arnav Tyagi",
  "gstNumber": "09ARNAV9012H3Z7",
  "phone": "9876500103",
  "isVerified": true,
  "message": "Current authenticated bidder profile"
}
```

---

### 2.7 Password Reset Flow

#### A. Forgot Password (Request OTP)
- **Method**: `POST`
- **Endpoint**: `/api/bidder/auth/forgot-password`
```json
{
  "email": "arnav24169006@gmail.com"
}
```
**Response**: `{"message": "Password reset OTP sent to your registered email."}`

#### B. Verify Forgot Password OTP
- **Method**: `POST`
- **Endpoint**: `/api/bidder/auth/verify-forgot-password-otp`
```json
{
  "email": "arnav24169006@gmail.com",
  "otp": "123456"
}
```
**Response**:
```json
{
  "message": "OTP verified successfully.",
  "resetToken": "4b68e9f546bb4c87893c834bc7721867"
}
```

#### C. Reset Password
- **Method**: `POST`
- **Endpoint**: `/api/bidder/auth/reset-password`
```json
{
  "resetToken": "4b68e9f546bb4c87893c834bc7721867",
  "newPassword": "NewPassword@123"
}
```
**Response**: `{"message": "Password reset successfully. You can now login with your new password."}`

---

## 3. Bidder Profile Management APIs

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bidder` | Get list of all registered bidders | 🔒 Bearer Token |
| `GET` | `/api/bidder/{id}` | Get specific bidder profile by ID | 🔒 Bearer Token |
| `PUT` | `/api/bidder/{id}` | Update bidder details (phone, address, etc.) | 🔒 Bearer Token |
| `DELETE` | `/api/bidder/{id}` | Delete bidder profile | 🔒 Bearer Token |

---

## 4. Officer Authentication & DigiLocker APIs

### 4.1 Officer Signup
Initiates officer registration and generates a DigiLocker OAuth verification URL.

- **Method**: `POST`
- **Endpoint**: `/api/officer/auth/signup` (or `/api/auth/signup`)
- **Auth Required**: No

#### Request Body
```json
{
  "name": "Itachi Uchiha",
  "departmentId": 1,
  "departmentName": "Public Works Department",
  "email": "arnav24169006@akgec.ac.in",
  "mobile": "+919876543210",
  "password": "Password@123"
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Signup initiated. Please verify identity via DigiLocker.",
  "data": {
    "tempToken": "732054aad4ec4d2390b51e5a2aaaf6c5",
    "authorizationUrl": "http://localhost:8080/api/officer/identity/mock-login?token=732054aad4ec4d2390b51e5a2aaaf6c5",
    "message": "Signup details saved. Please complete DigiLocker identity verification to proceed."
  },
  "timestamp": "2026-09-06T14:30:00.000"
}
```

---

### 4.2 DigiLocker Identity Verification
Verifies Aadhaar identity with simulated DigiLocker and automatically dispatches email OTP upon success.

- **Method**: `POST`
- **Endpoint**: `/api/officer/identity/mock-verify` (or `GET /api/officer/identity/mock-login?token={tempToken}`)
- **Auth Required**: No

#### Request Body
```json
{
  "tempToken": "732054aad4ec4d2390b51e5a2aaaf6c5"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Identity verified successfully",
  "data": {
    "identityVerified": true,
    "identityProvider": "DIGILOCKER_MOCK",
    "digilockerId": "DL-DEMO-001",
    "verifiedName": "Itachi Uchiha",
    "tempToken": "732054aad4ec4d2390b51e5a2aaaf6c5",
    "identityVerifiedAt": "2026-09-06T14:31:00.000"
  },
  "timestamp": "2026-09-06T14:31:00.000"
}
```

---

### 4.3 Verify Officer OTP
- **Method**: `POST`
- **Endpoint**: `/api/officer/auth/verify-otp` (or `/api/auth/verify-otp`)
- **Request Body**:
```json
{
  "email": "arnav24169006@akgec.ac.in",
  "otp": "123456"
}
```
- **Response (`200 OK`)**: Returns JWT authentication token and officer profile.

---

### 4.4 Officer Login & Profile
- **Login**: `POST /api/officer/auth/login` (Body: `{"emailOrMobile": "...", "password": "..."}`)
- **Get Profile**: `GET /api/officer/auth/me` (`Authorization: Bearer <token>`)

---

## 5. Tender Document Management & ML AI Integration (Cloudinary + AI Analysis)

### 5.1 Upload Tender Document
Uploads tender document PDF to **Cloudinary** and forwards to the **Python ML Service** (`http://20.40.44.184`) for OCR extraction, key criteria parsing, and authenticity/tamper detection.

- **Method**: `POST`
- **Endpoint**: `/api/officer/tenders/upload`
- **Content-Type**: `multipart/form-data`
- **Headers**: `Authorization: Bearer <OFFICER_JWT_TOKEN>`
- **Form Data**:
  - `file`: `[binary PDF / Image file]` (Required)
  - `title`: `Construction of High-Speed Flyover Corridor - GeM/2026/B/8912` (Required)
  - `description`: `National highway widening and elevated corridor tender notice.` (Optional)
  - `documentType`: `other` (Optional: `udyam_certificate`, `gst_certificate`, `pan_card`, `income_tax_return`, `oem_authorization`, or `other`)

#### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Tender document uploaded and analyzed successfully",
  "data": {
    "id": 1,
    "title": "Construction of High-Speed Flyover Corridor - GeM/2026/B/8912",
    "description": "National highway widening and elevated corridor tender notice.",
    "fileName": "tender_rfp_2026.pdf",
    "fileType": "application/pdf",
    "fileSize": 1048576,
    "fileUrl": "https://res.cloudinary.com/tender-portal/image/upload/v1725700000/tenders/tender_rfp_2026.pdf",
    "cloudinaryPublicId": "tenders/tender_rfp_2026_xyz123",
    "documentType": "other",
    "uploadedByOfficerId": 1,
    "uploadedByOfficerName": "Rajesh Sharma",
    "uploadedByEmail": "officer@pwd.gov.in",
    "departmentName": "Public Works Department",
    "status": "PROCESSED",
    "authenticityScore": 0.98,
    "isAuthentic": true,
    "rawOcrText": "GOVERNMENT OF INDIA - MINISTRY OF ROAD TRANSPORT & HIGHWAYS\nNOTICE INVITING TENDER\nEstimated Cost: Rs 15,00,00,000\nEMD: Rs 30,00,000...",
    "structuredData": {
      "tender_value": "₹ 15,00,00,000",
      "emd_amount": "₹ 30,00,000",
      "submission_deadline": "2026-10-15T18:00:00Z"
    },
    "authenticityDetails": {
      "signature_verified": true,
      "tampering_detected": false,
      "confidence": 0.98
    },
    "createdAt": "2026-09-07T13:30:00.000",
    "updatedAt": "2026-09-07T13:30:00.000"
  },
  "timestamp": "2026-09-07T13:30:00.000"
}
```

---

### 5.2 Get All Officer Tenders
- **Method**: `GET`
- **Endpoint**: `/api/officer/tenders`
- **Headers**: `Authorization: Bearer <OFFICER_JWT_TOKEN>`
- **Response**: List of all tender documents uploaded by the authenticated officer with Cloudinary links and ML status.

---

### 5.3 Get Tender Details by ID
- **Method**: `GET`
- **Endpoint**: `/api/officer/tenders/{id}`
- **Headers**: `Authorization: Bearer <OFFICER_JWT_TOKEN>`
- **Response**: Full tender entity, Cloudinary URL, complete OCR text, structured criteria, and authenticity scores.

---

### 5.4 Compare Bidders via ML CIS Algorithm
- **Method**: `POST`
- **Endpoint**: `/api/officer/tenders/{id}/compare-bidders`
- **Headers**: `Authorization: Bearer <OFFICER_JWT_TOKEN>`
- **Request Body**:
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
- **Response**: CIS ranking score, compliance breakdowns, and top bidder recommendations.

---

### 5.5 Supported Document Types & ML Health
- **Document Types**: `GET /api/officer/tenders/document-types`
- **ML Service Health**: `GET /api/officer/tenders/ml-health`

---

## 6. Error Handling & Status Codes

| Status Code | Description | Example Scenario |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | OTP verified, Token verified, Login successful |
| `201 Created` | Resource created | Signup initiated, Tender uploaded |
| `400 Bad Request` | Validation failure / Mismatch | Identity mismatch or invalid OTP entered |
| `401 Unauthorized` | Authentication failure | Invalid password or missing JWT token |
| `404 Not Found` | Resource not found | User or Tender not found |
| `500 Server Error` | Internal exception | Database connection timeout or service failure |

