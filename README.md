# 🏛️ GeM CompliFlix — SIH 2026 Platform Technical Documentation
> **Autonomous AI/ML Tender Compliance, Fraud Detection, Forensic Document Verification & RAG Intelligence System**
> **Compliant with:** GFR 2017, GeM GTC v4.0, DPIIT Make in India, Rule 144(xi), and MSME Public Procurement Policy 2012.
## **Testing Credientials**:
> **Bidder:** <br/> username: rajatsre455@gmail.com password:Rajat@123 <br/>
> **Officer:** <br/> username: vanshsharma0963@gmail.com password: Vansh@123
---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [User Personas & Role-Based Access Control (RBAC)](#3-user-personas--role-based-access-control-rbac)
4. [End-to-End Data Flow Architecture (DFD)](#4-end-to-end-data-flow-architecture-dfd)
   - [Level 0: Context Data Flow Diagram](#level-0-context-data-flow-diagram)
   - [Level 1: System-Wide Process Decomposition](#level-1-system-wide-process-decomposition)
   - [Level 2: Subsystem Deep Dive (Bid Evaluation & ML Verification)](#level-2-subsystem-deep-dive)
5. [Process Workflows & Sequence Diagrams](#5-process-workflows--sequence-diagrams)
   - [5.1A: Procurement Officer Authentication & DigiLocker Flow](#51a-procurement-officer-authentication--digilocker-flow)
   - [5.1B: Commercial Bidder Registration & Onboarding Flow](#51b-commercial-bidder-registration--onboarding-flow)
   - [5.2: Tender Upload, Cloudinary Storage & Vector Ingestion](#52-tender-upload-cloudinary-storage--vector-ingestion)
   - [5.3: Forensic ML Verification & Dynamic CIS Engine](#53-forensic-ml-verification--dynamic-cis-engine)
   - [5.4: Contextual RAG Chatbot Pipeline (Gemini + pgvector)](#54-contextual-rag-chatbot-pipeline)
   - [5.5: Automated Single-Click Clearance & QCBS Ranking](#55-automated-single-click-clearance--qcbs-ranking)
6. [Frontend Client Architecture & UI Subsystem](#6-frontend-client-architecture--ui-subsystem)
   - [Client Component Hierarchy & Design Tokens](#61-client-component-hierarchy--design-tokens)
   - [DocumentPreviewModal & Forensic Inspection](#62-documentpreviewmodal--forensic-inspection)
   - [Real-Time Bid Submission & Officer Evaluation Bridge](#63-real-time-bid-submission--officer-evaluation-bridge)
   - [State Management & Context Providers](#64-state-management--context-providers)
7. [Machine Learning & Forensic Architecture](#7-machine-learning--forensic-architecture)
8. [Vector Database & Generative AI RAG Architecture](#8-vector-database--generative-ai-rag-architecture)
9. [Database Schema & Entity-Relationship (ER) Diagram](#9-database-schema--entity-relationship-er-diagram)
10. [Consolidated API Catalog & Endpoints](#10-consolidated-api-catalog--endpoints)
11. [Statutory Compliance & Regulatory Rules Engine](#11-statutory-compliance--regulatory-rules-engine)
12. [Deployment, Infrastructure & Security](#12-deployment-infrastructure--security)
13. [Testing, Verification & Quality Assurance Suite](#13-testing-verification--quality-assurance-suite)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Challenge in Public Procurement
Government procurement across India via **GeM (Government e-Marketplace)** processes hundreds of thousands of tenders annually worth billions of dollars. However, procurement officers and public institutions face significant operational risks:
1. **Document Forgery & Tampering**: Submissions often contain manipulated balance sheets, counterfeit GST returns, tampered CA certificates, or cloned UDIN/Udyam certificates.
2. **Cartelization & Bid Rigging**: Unethical syndicates deploy shell entities with common ownership, collusive pricing patterns, or shared digital footprints to manipulate L-1 pricing.
3. **Manual Compliance Bottlenecks**: Scrutinizing complex 100+ page tender documents and cross-referencing statutory compliance (GFR 2017, Rule 144(xi) Land Border restrictions, Make in India thresholds, and MSME/Startup exemptions) takes days per bid.
4. **Information Asymmetry**: Bidders struggle to understand intricate tender clauses, leading to unintentional disqualifications or non-compliance.

### 1.2 The Solution: GeM CompliFlix
**GeM CompliFlix** is an enterprise-grade, end-to-end intelligent procurement governance suite built for **SIH 2026**. It unifies:
- **Dual Portal UI**: Dedicated interfaces for Procurement Officers and Commercial Bidders.
- **Multi-Stage Forensic ML Engine**: Automated OCR, cryptographic signature validation (pyHanko), QR code decoding (pyzbar), Mod-36 GSTIN verification, and Random Forest qualification predictors.
- **Dynamic CIS (Compliance Integrity Score) Engine**: Continuous 0.0–1.0 index weighted across 18 Indian procurement document categories.
- **Google Gemini RAG + pgvector**: Contextual conversational intelligence for instant clause interpretation, multi-bidder comparison, and tender requirement matching.
- **Single-Click Clearance & QCBS Ranking**: Quality and Cost Based Selection, GFR 173(i) MSE/Startup automated exemptions, and audit trails.

---

## 2. High-Level System Architecture

The platform follows a **clean, 4-tier layered architecture** with strictly defined boundaries:

```mermaid
graph TB
    %% STYLING DEFINITIONS
    classDef clientStyle fill:#eef2ff,stroke:#6366f1,stroke-width:2px,color:#1e1b4b,rx:8px,ry:8px;
    classDef gatewayStyle fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d,rx:8px,ry:8px;
    classDef microStyle fill:#fdf4ff,stroke:#d946ef,stroke-width:2px,color:#701a75,rx:8px,ry:8px;
    classDef dataStyle fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#78350f,rx:8px,ry:8px;
    classDef extStyle fill:#f8fafc,stroke:#94a3b8,stroke-width:2px,stroke-dasharray: 4 4,color:#334155,rx:8px,ry:8px;

    %% TIER 1: CLIENT PRESENTATION
    subgraph TIER_1 ["🖥️ Tier 1: Client Presentation Layer (React 18 + Vite SPA)"]
        direction LR
        UI_Officer["🏛️ Procurement Officer Portal<br/>• Tender Ingestion & NIT Notices<br/>• Forensic Audits & QCBS Ranking<br/>• Single-Click Clearance Console"]:::clientStyle
        UI_Bidder["🏢 Commercial Bidder Portal<br/>• Bid Document Vault<br/>• Pre-Submission CIS Self-Check<br/>• AI Bidder Copilot Assistant"]:::clientStyle
        UI_Common["🎨 Shared Design Subsystem<br/>• Tricolor Bar & GeM Badges<br/>• Document Preview Modal<br/>• Real-time Sync Store"]:::clientStyle
    end

    %% TIER 2: API GATEWAY & BUSINESS ENGINE
    subgraph TIER_2 ["⚙️ Tier 2: Core API Gateway & Security (Spring Boot 3.x / Java 17)"]
        direction LR
        GW_Security["🛡️ Security & RBAC Engine<br/>• Dual JWT Filters (Officer / Bidder)<br/>• Rate Limiter (5 req / 60s)<br/>• BCrypt Password Hashing"]:::gatewayStyle
        GW_Controllers["📦 Business Logic Controllers<br/>• Tender Lifecycle Controller<br/>• Bid Submission & Vault Manager<br/>• Audit Trail Dispatcher"]:::gatewayStyle
        GW_Orchestrator["🔄 Microservice Orchestrator<br/>• RestClient ML Connector<br/>• Node RAG Service Gateway<br/>• Cloudinary Media Streamer"]:::gatewayStyle
    end

    %% TIER 3: INTELLIGENCE & PROCESSING
    subgraph TIER_3 ["🧠 Tier 3: Processing & Intelligence Microservices"]
        direction LR
        subgraph ML_BOX ["Python Forensic ML Engine (v2.0.0)"]
            ML_Forensic["🔍 Forensic Verification<br/>• pyHanko Digital Signatures<br/>• pyzbar QR Payload Match<br/>• OpenCV Seal & Stamp OCR"]:::microStyle
            ML_Scoring["📊 Dynamic CIS & Verdicts<br/>• 18-Category Document Weighting<br/>• Mod-36 GSTIN Checksum<br/>• Random Forest Predictor"]:::microStyle
        end
        subgraph RAG_BOX ["Node.js AI RAG Microservice (Gemini)"]
            RAG_Embed["📐 Semantic Embedding Pipeline<br/>• Recursive Character Splitter<br/>• Gemini text-embedding-004<br/>• Cosine Similarity Router"]:::microStyle
            RAG_Gen["🤖 Conversational Copilot<br/>• Gemini 1.5 Pro / 3.6 Flash<br/>• GFR 2017 & GeM Rules Engine<br/>• Multi-Bidder Comparison"]:::microStyle
        end
    end

    %% TIER 4: DATA & ASSETS
    subgraph TIER_4 ["💾 Tier 4: Enterprise Data & Cloud Storage"]
        direction LR
        DB_Relational[("🗄️ PostgreSQL 16 (NeonDB)<br/>• Users, Officers & Bidders<br/>• Submissions & Verifications<br/>• Statutory Pre-Validation Records")]:::dataStyle
        DB_Vector[("⚡ PostgreSQL pgvector<br/>• tender_embeddings (768-D)<br/>• bidder_embeddings (768-D)<br/>• summary_embeddings (768-D)")]:::dataStyle
        Cloud_Media[("☁️ Cloudinary Media Bucket<br/>• /tenders/ (Tender PDFs)<br/>• /bidders/ (Certificates, P&L)<br/>• Signed Tamper-Proof URLs")]:::dataStyle
    end

    %% EXTERNAL PROVIDERS
    subgraph TIER_EXT ["🌐 External Government & SaaS Integrations"]
        direction LR
        EXT_Digi["🇮🇳 MeriPehchaan / DigiLocker<br/>OAuth 2.0 Identity Provider"]:::extStyle
        EXT_GST["🏛️ GSTN / MCA21 Registry<br/>Live Taxpayer Status API"]:::extStyle
        EXT_Email["📧 Brevo Transactional API<br/>6-Digit Email OTP Dispatch"]:::extStyle
    end

    %% INTER-TIER CONNECTIONS
    TIER_1 -->|HTTPS / REST + JWT| TIER_2
    TIER_2 -->|Internal API Calls| TIER_3
    TIER_2 -->|SQL & Transactions| DB_Relational
    TIER_2 -->|Multipart PDF Stream| Cloud_Media
    TIER_3 -->|pgvector Query / Store| DB_Vector
    TIER_2 -.->|OAuth 2.0| EXT_Digi
    TIER_2 -.->|Transactional Mail| EXT_Email
    ML_BOX -.->|Live Lookup| EXT_GST
```

---

## 3. User Personas & Role-Based Access Control (RBAC)

The application enforces strict separation of concerns via dual JWT authentication tokens and filter chains:

| Attribute | Procurement Officer | Commercial Bidder | Public / Visitor |
| :--- | :--- | :--- | :--- |
| **Role Identifier** | `ROLE_OFFICER` | `BIDDER` | Unauthenticated |
| **Primary Identifier**| Employee ID (`EMP101`) + Dept Email | Company GSTIN + Official Email | Anonymous |
| **Identity Verification**| DigiLocker / MeriPehchaan + Gov Database | GSTIN / PAN Mod-36 + Brevo Email OTP | None |
| **Allowed Actions** | • Upload & publish tenders<br/>• Run batch ML forensic audits<br/>• View tamper reports & signatures<br/>• Inspect AI multi-bidder comparison<br/>• Issue Single-Click Clearances<br/>• Evaluate QCBS score & L1 awards | • Browse active published tenders<br/>• Upload compliance vault documents<br/>• Run pre-submission CIS audit<br/>• Query Bidder AI Copilot<br/>• Submit bids with quoted prices<br/>• Track real-time evaluation status | • Browse public tenders<br/>• View tender notices & dates<br/>• Read platform documentation |
| **Security Filters** | `OfficerAuthTokenFilter` (`/api/officer/**`) | `BidderAuthTokenFilter` (`/api/bidder/**`)| `WebMvcCorsConfig` (PermitAll `/tenders`) |

---

## 4. End-to-End Data Flow Architecture (DFD)

### Level 0: Context Data Flow Diagram
A clean hub-and-spoke view illustrating boundary interactions:

```mermaid
flowchart LR
    classDef actorStyle fill:#eef2ff,stroke:#6366f1,stroke-width:2px,color:#1e1b4b,rx:8px,ry:8px;
    classDef sysStyle fill:#f0fdf4,stroke:#22c55e,stroke-width:3px,color:#14532d,rx:12px,ry:12px;
    classDef extStyle fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#78350f,rx:8px,ry:8px;

    Officer(["🏛️ Procurement Officer"]):::actorStyle
    Bidder(["🏢 Commercial Bidder"]):::actorStyle
    
    System[["🏛️ GeM CompliFlix AI Platform<br/>• Gateway • ML Engine • RAG • Storage"]]:::sysStyle
    
    GovtServices["🇮🇳 Govt Registries<br/>(GSTN / MeriPehchaan)"]:::extStyle
    CloudinaryStorage["☁️ Cloudinary Storage<br/>(Tamper-Proof PDFs)"]:::extStyle

    %% Officer Interactions
    Officer -->|1. Publish Tender & Criteria| System
    Officer -->|2. Request Forensic ML Audit| System
    Officer -->|3. Query RAG & Award Clearance| System
    System -->|Deliver Audit Dossier & Rankings| Officer

    %% Bidder Interactions
    Bidder -->|1. Register & Verify GSTIN| System
    Bidder -->|2. Upload Vault Documents| System
    Bidder -->|3. Run CIS Pre-Check & Submit Bid| System
    System -->|Return CIS Report & Live Status| Bidder

    %% External Systems
    System <-->|Verify Identities & Taxpayer Data| GovtServices
    System <-->|Upload & Retrieve Cryptographic PDFs| CloudinaryStorage
```

---

### Level 1: System-Wide Process Decomposition
Decomposing the platform into its 5 primary operational stages:

```mermaid
flowchart LR
    classDef procStyle fill:#f8fafc,stroke:#3b82f6,stroke-width:2px,color:#1e293b,rx:6px,ry:6px;
    classDef storeStyle fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#7c2d12,rx:4px,ry:4px;

    subgraph PIPELINE ["Platform Operational Pipeline"]
        direction LR
        P1["1. Identity & Access<br/>• Pre-check records<br/>• Brevo OTP validation<br/>• Dual JWT issue"]:::procStyle
        P2["2. Tender Ingestion<br/>• Cloudinary upload<br/>• 6-Pillar ML parsing<br/>• 768-D vector indexing"]:::procStyle
        P3["3. Vault & Forensics<br/>• pyHanko signature check<br/>• pyzbar QR verification<br/>• Mod-36 GSTIN match"]:::procStyle
        P4["4. CIS & Clearance<br/>• 18-doc weighted scoring<br/>• GFR 173(i) MSE waivers<br/>• Single-click clearance"]:::procStyle
        P5["5. Conversational RAG<br/>• Cosine vector retrieval<br/>• Strict GFR prompt frame<br/>• Gemini LLM answers"]:::procStyle

        P1 ==> P2 ==> P3 ==> P4 ==> P5
    end

    subgraph STORES ["Data Persistence"]
        direction TB
        DS_Rel[("🗄️ PostgreSQL NeonDB")]:::storeStyle
        DS_Vec[("⚡ pgvector Store")]:::storeStyle
        DS_Cld[("☁️ Cloudinary Bucket")]:::storeStyle
    end

    P1 <--> DS_Rel
    P2 <--> DS_Cld
    P2 <--> DS_Vec
    P3 <--> DS_Rel
    P4 <--> DS_Rel
    P5 <--> DS_Vec
```

---

### Level 2: Subsystem Deep Dive (Bid Evaluation & ML Verification)
Detailed, clean three-phase execution flow inside the forensic engine:

```mermaid
flowchart TD
    classDef phaseStyle fill:#f1f5f9,stroke:#64748b,stroke-width:1.5px,color:#0f172a,rx:8px,ry:8px;
    classDef procStyle fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a,rx:6px,ry:6px;
    classDef passStyle fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#064e3b,rx:6px,ry:6px;
    classDef failStyle fill:#fff1f2,stroke:#f43f5e,stroke-width:2px,color:#881337,rx:6px,ry:6px;
    classDef modelStyle fill:#fdf4ff,stroke:#a855f7,stroke-width:2px,color:#581c87,rx:8px,ry:8px;

    InDoc["📄 Uploaded Proposal Document (PDF / Scan)"]

    subgraph PHASE_A ["Phase 1: Multi-Modal Extraction"]
        direction LR
        S1["pyHanko Engine<br/>Extract X.509 Certificate"]:::procStyle
        S2["pyzbar Engine<br/>Decode Signed QR Payload"]:::procStyle
        S3["OpenCV Engine<br/>Detect Stamp & Seal Contours"]:::procStyle
        S4["OCR & NER Engine<br/>Extract Text, GSTIN, PAN, Dates"]:::procStyle
    end

    subgraph PHASE_B ["Phase 2: Integrity & Statutory Checks"]
        direction LR
        C1{"Digital Sig<br/>Valid?"}:::procStyle
        C2{"QR Payload Matches<br/>Visual Text?"}:::procStyle
        C3{"GSTIN Mod-36<br/>Checksum Valid?"}:::procStyle
    end

    subgraph PHASE_C ["Phase 3: Machine Learning Inference"]
        direction TB
        F_Vec["📐 9-Dimensional Mathematical Feature Vector<br/>[OCR Conf, Sig Valid, QR Match, Stamp Found, Mod-36 Valid, ...]"]:::procStyle
        RF_Model["🌲 Random Forest Classifier & Regressor<br/>Trained on Indian Procurement Compliance Datasets"]:::modelStyle
        Out_Result["✅ Final Forensic Report & CIS Verdict<br/>• CIS Score: 0.0 - 1.0 (Continuous Index)<br/>• Authenticity Status: AUTHENTIC / FLAGGED<br/>• GFR 173(i) MSE Eligibility & Exemption Flags"]:::passStyle
    end

    InDoc --> PHASE_A
    S1 --> C1
    S2 --> C2
    S3 --> F_Vec
    S4 --> C3

    C1 -->|Pass| F_Vec
    C1 -->|Fail| F_Vec
    C2 -->|Match| F_Vec
    C2 -->|Mismatch| F_Vec
    C3 -->|Valid| F_Vec
    C3 -->|Invalid| F_Vec

    F_Vec --> RF_Model --> Out_Result
```

---

## 5. Process Workflows & Sequence Diagrams

### 5.1A: Procurement Officer Authentication & DigiLocker Flow

```mermaid
sequenceDiagram
    autonumber
    actor Officer as 🏛️ Procurement Officer
    participant Gateway as ⚙️ Spring Boot API
    participant DB as 🗄️ PostgreSQL (NeonDB)
    participant Digi as 🇮🇳 MeriPehchaan / DigiLocker
    participant Brevo as 📧 Brevo Email Service

    Officer->>Gateway: 1. POST /api/officer/auth/initiate (employeeId: EMP101, dept)
    Gateway->>DB: Query government_employees table
    DB-->>Gateway: Record Validated (PWD Department)
    Gateway-->>Officer: 200 OK (Pre-Validation Success)

    Officer->>Gateway: 2. POST /api/officer/auth/signup (Name, Password, Mobile)
    Gateway->>Brevo: Dispatch 6-Digit Email OTP
    Gateway->>DB: Save officer_temp_registration
    Gateway-->>Officer: 200 OK (OTP Sent to Official Email)

    Officer->>Gateway: 3. POST /api/officer/auth/verify-otp (Email, OTP)
    Gateway->>DB: Validate OTP & Promote to Permanent Officer Record
    Gateway-->>Officer: 200 OK (Registration Finalized)

    Officer->>Gateway: 4. POST /api/officer/auth/mock-verify (DigiLocker ID: DL-DEMO-001)
    Gateway->>DB: Update verification_status = 'VERIFIED'
    Gateway-->>Officer: 200 OK (Identity Certified)

    Officer->>Gateway: 5. POST /api/officer/auth/login (Email, Password)
    Gateway-->>Officer: 200 OK (Bearer JWT Issued with ROLE_OFFICER)
```

---

### 5.1B: Commercial Bidder Registration & Onboarding Flow

```mermaid
sequenceDiagram
    autonumber
    actor Bidder as 🏢 Commercial Bidder
    participant Gateway as ⚙️ Spring Boot API
    participant DB as 🗄️ PostgreSQL (NeonDB)
    participant Brevo as 📧 Brevo Email Service

    Bidder->>Gateway: 1. POST /api/bidder/auth/signup (Company, Legal Name, GSTIN, Password)
    Gateway->>DB: Verify GSTIN is unique and valid (Mod-36 check)
    Gateway->>Brevo: Dispatch 6-Digit Business Email OTP
    Gateway->>DB: Save bidder_temp_registration
    Gateway-->>Bidder: 200 OK (OTP Dispatched to Registered Business Email)

    Bidder->>Gateway: 2. POST /api/bidder/auth/verify-otp (Email, OTP)
    Gateway->>DB: Validate OTP & Insert into bidders table
    Gateway-->>Bidder: 200 OK (Bearer JWT Issued with ROLE_BIDDER)

    Bidder->>Gateway: 3. GET /api/bidder/{id} (With Bearer Token)
    Gateway->>DB: Fetch Bidder Profile & Verified Badges
    Gateway-->>Bidder: 200 OK (Verified Commercial Bidder Dashboard Loaded)
```

---

### 5.2: Tender Upload, Cloudinary Storage & Vector Ingestion

```mermaid
sequenceDiagram
    autonumber
    actor Officer as 🏛️ Procurement Officer
    participant Gateway as ⚙️ Spring Boot API
    participant Cloud as ☁️ Cloudinary Storage
    participant ML as 🧠 Python ML Service
    participant RAG as 🤖 Node.js AI RAG
    participant PG as ⚡ pgvector Store

    Officer->>Gateway: 1. POST /api/officer/tenders/upload (Multipart PDF, Title, Dept)
    Gateway->>Cloud: 2. Upload PDF to /tenders/
    Cloud-->>Gateway: Secure URL & Cloudinary Public ID

    Gateway->>ML: 3. POST /api/ml/process-document (PDF Stream)
    ML->>ML: OCR, 6-Pillar Extraction, Turnover Benchmarks
    ML-->>Gateway: Structured JSON, Raw Text & Authenticity Score

    Gateway->>PG: 4. INSERT INTO tender_documents (Metadata, Status='PROCESSED')
    PG-->>Gateway: Generated Tender ID (e.g. 6)

    Gateway->>RAG: 5. POST /api/ai/tender/process (tenderId: 6, pdfUrl)
    RAG->>RAG: Chunk Text (1,000 chars) & Generate Embeddings (text-embedding-004)
    RAG->>PG: 6. INSERT INTO tender_embeddings (768-D Vectors)
    RAG-->>Gateway: 200 OK (Indexed Chunks)

    Gateway-->>Officer: 201 Created (Tender Live, Stored & Searchable)
```

---

### 5.3: Forensic ML Verification & Dynamic CIS Engine

```mermaid
sequenceDiagram
    autonumber
    actor Bidder as 🏢 Commercial Bidder
    participant Gateway as ⚙️ Spring Boot API
    participant Cloud as ☁️ Cloudinary Storage
    participant ML as 🧠 Python ML Service (20.40.44.184)
    participant DB as 🗄️ PostgreSQL (NeonDB)

    Bidder->>Gateway: 1. POST /api/bidder/documents/upload (File: gst_cert.pdf, type: 'gst')
    Gateway->>Cloud: Upload PDF to /bidders/
    Cloud-->>Gateway: Cloudinary URL & Public ID

    Gateway->>ML: 2. POST /api/ml/process-document (full_analysis=true)
    ML->>ML: pyHanko signature check + pyzbar QR verification + Mod-36 GSTIN match
    ML-->>Gateway: Return Authenticity Score (0.96), Status: AUTHENTIC

    Gateway->>DB: 3. INSERT INTO bidder_documents (Scores, Flags, Cloudinary URL)
    Gateway-->>Bidder: 201 Created (Document Certified & Stored)

    Note over Bidder, ML: Pre-Submission Self-Audit
    Bidder->>Gateway: 4. POST /api/bidder/documents/check-cis (tenderId: 6)
    Gateway->>ML: POST /api/ml/automate-all (Tender Specs + Bidder Documents)
    ML->>ML: Weighted CIS Evaluation + GFR 173(i) MSE Waiver Check + Random Forest Score
    ML-->>Gateway: CIS Score: 0.88 (Compliant, Low Risk)
    Gateway-->>Bidder: 200 OK (Ready to Submit without Deficiencies)
```

---

### 5.4: Contextual RAG Chatbot Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Officer or Bidder
    participant Client as 🖥️ React Chat UI
    participant Gateway as ⚙️ Spring Boot API
    participant RAG as 🤖 Node.js RAG Service
    participant PG as ⚡ pgvector Store
    participant Gemini as 🧠 Google Gemini LLM

    User->>Client: 1. Asks question: "Does this tender require Make in India Class-I supplier status?"
    Client->>Gateway: 2. POST /api/officer/tenders/6/chat (query, bidderId: 3)
    Gateway->>RAG: 3. POST /api/ai/bidder-tender-chat/ask

    RAG->>RAG: Convert query into 768-D Vector (text-embedding-004)
    RAG->>PG: 4. SELECT * FROM tender_embeddings ORDER BY embedding <=> query LIMIT 5
    PG-->>RAG: Top 5 Matching Tender Clauses
    RAG->>PG: 5. SELECT * FROM bidder_embeddings ORDER BY embedding <=> query LIMIT 5
    PG-->>RAG: Top 5 Matching Bidder Credentials

    RAG->>RAG: Assemble Prompt with GFR 2017 & GeM GTC Rules
    RAG->>Gemini: 6. Invoke gemini-3.6-flash / 1.5-pro with Context
    Gemini-->>RAG: Formatted Legal-Grade Response with Citations

    RAG-->>Gateway: 7. Return Answer & Source Excerpts
    Gateway-->>Client: 200 OK
    Client-->>User: 8. Render Structured Markdown Response with Source Badges
```

---

### 5.5: Automated Single-Click Clearance & QCBS Ranking

```mermaid
sequenceDiagram
    autonumber
    actor Officer as 🏛️ Procurement Officer
    participant Gateway as ⚙️ Spring Boot API
    participant ML as 🧠 Python ML Service
    participant DB as 🗄️ PostgreSQL (NeonDB)

    Officer->>Gateway: 1. GET /api/officer/tenders/6/submissions
    Gateway->>DB: Fetch all submissions for tender 6
    DB-->>Gateway: Return 3 active proposals (ABC Tech, Sharma Ind, Apex Ltd)
    Gateway-->>Officer: Render Submissions Table

    Officer->>Gateway: 2. POST /api/officer/tenders/6/compare-bidders (bidderIds: [1, 2, 3])
    Gateway->>ML: POST /api/ml/automate-all (bidders_data, tender_specification)
    ML->>ML: Evaluate QCBS Formula: S = (Tech * 0.70) + (L1/Price * 0.30 * 100)
    ML-->>Gateway: Ranked Bidders Matrix (Rank 1: ABC Tech, Score: 94.2)
    Gateway-->>Officer: Display Interactive QCBS Ranking & Top Bidders

    Officer->>Gateway: 3. POST /api/officer/tenders/ml/process-clearance (tenderId: 6, bidderId: 1)
    Gateway->>ML: POST /api/ml/process-clearance
    ML-->>Gateway: Status: APPROVED, Risk: NEGLIGIBLE
    Gateway->>DB: UPDATE bid_submissions SET evaluation_status='Approved', officer_verdict='CLEARED'
    Gateway-->>Officer: 200 OK (Single-Click Clearance Certificate Generated)
```

---

## 6. Frontend Client Architecture & UI Subsystem

The Client is built on **React 18** and bundled with **Vite**, adhering to modern Government of India digital design standards (NIC, Digital India, and GeM Compliance branding).

### 6.1 Client Component Hierarchy & Design Tokens
```
Client/src/
├── components/
│   ├── common/
│   │   ├── Navbar.jsx & Footer.jsx (Tricolor accents & National Emblem)
│   │   ├── DocumentPreviewModal.jsx (Class-3 DSC & Section 65B Certificate Viewer)
│   │   ├── BidderChatBot.jsx & ChatBox.jsx (Contextual AI Assist)
│   │   └── MarkdownRenderer.jsx (Clean legal citation rendering)
│   ├── tender/
│   │   ├── TenderCard.jsx & TenderDetailModal.jsx
│   │   ├── AiEvaluationDrawer.jsx (Side-by-side proposal review)
│   │   ├── ProcurementClearanceModal.jsx (One-click statutory approval)
│   │   └── TopBiddersSection.jsx & QcbsBiddersRanking.jsx
│   └── documents/
│       ├── DocumentUploader.jsx (Drag-and-drop multipart uploader)
│       └── DocumentUploadModal.jsx
├── pages/
│   ├── Dashboard/
│   │   ├── TenderSubmissionsView.jsx (Officer Master Evaluation Queue)
│   │   ├── OfficerUploadExtractView.jsx (Tender parsing view)
│   │   ├── BidderDashboard.jsx (Bidder vault and live analytics)
│   │   └── TopBiddersView.jsx
│   ├── MyApplications/
│   │   └── MyApplications.jsx (Bidder application status & tracking)
│   ├── Audit/
│   │   └── AuditTrail.jsx (Tamper-evident system activity log)
│   └── Verification/
│       └── Verification.jsx (Forensic document review)
├── services/
│   ├── api.js (Axios instance with Bearer JWT interceptors)
│   ├── authService.js (Dual role signup/login & DigiLocker)
│   ├── documentViewerService.js (jsPDF dynamic certificate generator)
│   └── mlService.js & aiService.js
└── store/
    ├── slices/ (authSlice, dashboardSlice, tenderSlice, uiSlice)
    └── index.js (Redux Toolkit root store)
```

### 6.2 DocumentPreviewModal & Forensic Inspection
The `DocumentPreviewModal` component provides an enterprise-grade document inspection interface:
1. **Document Preview Tab**: Renders native PDFs inside a sandboxed `iframe` or responsive image viewer, supporting full-screen inspection, printing, and direct file download.
2. **Forensics & DSC Stamp Tab**:
   - Displays Section 65B Indian Evidence Act certification status.
   - Shows Class-3 Digital Signature Certificate (DSC) verification details.
   - Displays computed **SHA-256 Digest Token** with one-click clipboard copying.
   - Confirms primary registry synchronization (MCA21, GSTN, CBDT).
3. **Extracted OCR Clauses Tab**:
   - Presents verbatim raw OCR transcripts extracted by the Python ML pipeline.
   - Allows officers to inspect hidden text, clauses, and key named entities without opening large external files.

### 6.3 Real-Time Bid Submission & Officer Evaluation Bridge
The system ensures complete real-time synchronization between the Commercial Bidder Portal and Procurement Officer Dashboard:
- When a bidder submits a proposal via `POST /api/bidder/documents/submit-bid`, a permanent record is created in `bid_submissions` with status `Pending`.
- The Procurement Officer views all live incoming proposals inside `TenderSubmissionsView.jsx` via `GET /api/officer/tenders/submissions`.
- Officers inspect compliance scores, launch `AiEvaluationDrawer.jsx`, review individual documents via `DocumentPreviewModal.jsx`, and record their evaluation verdict (`Approved` / `Rejected`) with official remarks via `PUT /api/officer/tenders/submissions/{subId}/evaluate`.
- The bidder instantly sees the updated evaluation status, timestamp, and officer remarks in their `MyApplications.jsx` portal.

### 6.4 State Management & Context Providers
- **Redux Toolkit**: Centralized store managing authenticated user state, active tender lists, UI notification drawers, and dashboard metrics.
- **`AuthContext.jsx`**: Provides persistent session management, role verification helpers (`isOfficerUser`, `getUserDisplayName`), and token refresh hooks.
- **`LanguageContext.jsx` & `ThemeContext.jsx`**: Multilingual support (English / Hindi) and accessible dark/light themes.

---

## 7. Machine Learning & Forensic Architecture

The Python ML microservice (v2.0.0) operates at `http://20.40.44.184` and provides **13 consolidated production endpoints**:

```mermaid
graph TB
    classDef inputStyle fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a,rx:8px,ry:8px;
    classDef toolStyle fill:#f8fafc,stroke:#64748b,stroke-width:1.5px,color:#0f172a,rx:6px,ry:6px;
    classDef vecStyle fill:#fdf4ff,stroke:#a855f7,stroke-width:2px,color:#581c87,rx:6px,ry:6px;
    classDef outStyle fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#064e3b,rx:8px,ry:8px;

    Doc["📄 Input Document (PDF / Scanned Certificate)"]:::inputStyle

    subgraph ENGINES ["Forensic Extraction Modules"]
        direction LR
        E1["🔏 pyHanko Engine<br/>• Cryptographic X.509 Signatures<br/>• Digital Certificate Chain Trust"]:::toolStyle
        E2["📱 pyzbar Engine<br/>• QR Barcode Decoding<br/>• Payload Tamper Cross-Check"]:::toolStyle
        E3["🔍 OpenCV Vision<br/>• Official Rubber Stamp Detection<br/>• Physical Seal Contours"]:::toolStyle
        E4["📝 OCR & Layout<br/>• Tesseract / PaddleOCR<br/>• Form Field & Table Parsing"]:::toolStyle
    end

    Doc --> E1
    Doc --> E2
    Doc --> E3
    Doc --> E4

    subgraph FEAT_ENG ["Feature Engineering & Model Pipeline"]
        direction TB
        F_Vec["📐 9-Dimensional Feature Vector<br/>[OCR Conf, Sig Valid, QR Match, Stamp Found, Mod-36 Valid, ...]"]:::vecStyle
        RF["🌲 Random Forest Classifier & Regressor<br/>• GFR 173(i) MSE/Startup Exemption Engine<br/>• 18 Document Categories Dynamic Weights"]:::vecStyle
    end

    E1 --> F_Vec
    E2 --> F_Vec
    E3 --> F_Vec
    E4 --> F_Vec

    F_Vec --> RF

    subgraph OUTPUT ["Statutory Verdict Output"]
        direction LR
        Res["🎯 Composite CIS Score (0.0 to 1.0)<br/>• Forensic Authenticity Verdict (PASS / FAIL)<br/>• Single-Click Clearance Recommendation"]:::outStyle
    end

    RF --> Res
```

### 7.1 The 9-D Feature Vector
Every uploaded document is transformed into a standardized 9-dimensional mathematical feature vector for the Random Forest engine:
1. `ocr_confidence` (Float, 0.0–1.0): Mean character recognition confidence.
2. `digital_signature_valid` (Boolean, 0 or 1): Validity of embedded cryptographic certificate.
3. `qr_code_detected` (Boolean, 0 or 1): Presence of machine-readable 2D barcode.
4. `qr_payload_matched` (Boolean, 0 or 1): Visual text identity matching signed QR payload.
5. `stamp_detected` (Boolean, 0 or 1): Optical detection of circular/rectangular government stamps.
6. `taxpayer_checksum_valid` (Boolean, 0 or 1): Mod-36 verification of 15-character GSTIN.
7. `date_consistency_score` (Float, 0.0–1.0): Chronological validity (issue date vs expiry vs tender submission).
8. `mandatory_fields_present` (Float, 0.0–1.0): Ratio of required statutory fields identified.
9. `tamper_anomaly_score` (Float, 0.0–1.0): Font inconsistency, pixel density variation, and compression artifacts.

### 7.2 18 Indian Procurement Document Categories
The Dynamic CIS Engine supports weighted evaluation across 18 specialized document classes:
- GST Registration Certificate (06/07/08/09/27 series)
- Permanent Account Number (PAN) Card
- Udyam MSME Registration Certificate
- Audited Balance Sheet & Profit & Loss Statement (3 consecutive financial years)
- CA Turnover Certificate with unique **UDIN (Unique Document Identification Number)**
- Net Worth Certificate
- Solvency Certificate from Scheduled Commercial Bank
- Experience / Past Performance Completion Certificate
- OEM (Original Equipment Manufacturer) Authorization Certificate
- Make in India Local Content Statutory Declaration (Class-I / Class-II)
- Land Border Sharing Rule 144(xi) Undertaking
- Non-Blacklisting / Non-Debarment Affidavit
- Integrity Pact (CVC prescribed format)
- EMD (Earnest Money Deposit) / Bid Security Declaration
- Technical Datasheet & Compliance Matrix
- ISO 9001 / ISO 27001 Quality & Security Certifications
- Power of Attorney / Board Resolution for Authorized Signatory
- Partnership Deed / Certificate of Incorporation (MCA)

---

## 8. Vector Database & Generative AI RAG Architecture

The Node.js microservice (`ai-services`) implements a live Retrieval Augmented Generation pipeline backed by **PostgreSQL `pgvector`**:

```mermaid
graph TB
    classDef queryStyle fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a,rx:8px,ry:8px;
    classDef embedStyle fill:#fdf4ff,stroke:#a855f7,stroke-width:2px,color:#581c87,rx:6px,ry:6px;
    classDef dbStyle fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#78350f,rx:6px,ry:6px;
    classDef promptStyle fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d,rx:6px,ry:6px;
    classDef outStyle fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#064e3b,rx:8px,ry:8px;

    Q["💬 User Query<br/>(e.g., 'What are the turnover requirements and GFR 173 waivers?')"]:::queryStyle

    subgraph VECTORIZATION ["Semantic Embedding Stage"]
        direction LR
        EMB["📐 Gemini text-embedding-004<br/>Generates 768-D Dense Float Array"]:::embedStyle
    end

    subgraph PGVECTOR ["PostgreSQL pgvector Engine"]
        direction TB
        MATCH["⚡ Cosine Distance Search (<=>)<br/>SELECT chunk, cosine_distance<br/>FROM tender_embeddings / bidder_embeddings<br/>ORDER BY embedding <=> query_vec LIMIT 5;"]:::dbStyle
    end

    subgraph AUGMENTATION ["Context & Prompt Engineering"]
        direction TB
        CTX["📑 Retrieved Context Chunks<br/>• Tender Clauses & BOQ Schedules<br/>• Bidder Uploaded Documents<br/>• Forensic ML Compliance Dossier"]:::promptStyle
        RULES["⚖️ Statutory Rule Anchors<br/>• GFR Rule 144(xi) Land Border Policy<br/>• GFR Rule 173(i) MSE/Startup Waivers<br/>• GeM GTC v4.0 Terms"]:::promptStyle
        PROMPT["📝 Augmented System Prompt"]:::promptStyle
    end

    subgraph GENERATION ["Generative LLM Inference"]
        direction LR
        LLM["🧠 Google Gemini 1.5 Pro / 3.6 Flash<br/>Zero-Hallucination Legal Reasoning"]:::outStyle
        RES["🎯 Formatted Markdown Response<br/>• Policy Excerpts & Clause Citations<br/>• Pass/Fail Findings & Officer Guidance"]:::outStyle
    end

    Q --> EMB --> MATCH --> CTX
    CTX --> PROMPT
    RULES --> PROMPT
    PROMPT --> LLM --> RES
```

### 8.1 Embeddings Schema & Indexes
- **Model**: Google Gemini `text-embedding-004` (768 dimensions).
- **Distance Metric**: Cosine Distance (`<=>`).
- **Chunking Strategy**: Recursive Character Text Splitter with `chunkSize: 1000` and `chunkOverlap: 200`.
- **Database Tables**:
  - `tender_embeddings`: `(id, tender_id, title, content, embedding vector(768), metadata, created_at)`
  - `bidder_embeddings`: `(id, bidder_id, document_id, document_type, content, embedding vector(768), metadata)`
  - `summary_embeddings`: `(id, identifier, content, embedding vector(768), metadata)`

---

## 9. Database Schema & Entity-Relationship (ER) Diagram

The system uses **PostgreSQL 16** hosted on serverless NeonDB. The relational model links officers, commercial bidders, physical tender documents, compliance vaults, submissions, pre-validation government registries, and vector embeddings:

```mermaid
erDiagram
    OFFICERS ||--o{ TENDER_DOCUMENTS : uploads
    OFFICERS ||--o{ OFFICER_EMAIL_OTP : authenticates
    
    BIDDERS ||--o{ BIDDER_DOCUMENTS : owns
    BIDDERS ||--o{ BID_SUBMISSIONS : submits
    BIDDERS ||--o{ BIDDER_EMAIL_OTP : authenticates
    BIDDERS ||--o{ BIDDER_VERIFICATION : verifies

    TENDER_DOCUMENTS ||--o{ BID_SUBMISSIONS : receives
    TENDER_DOCUMENTS ||--o{ TENDER_EMBEDDINGS : vectorizes

    BIDDER_DOCUMENTS ||--o{ BIDDER_EMBEDDINGS : vectorizes

    GOVERNMENT_EMPLOYEES ||--o{ OFFICERS : pre_validates
    MOCK_GST_RECORDS ||--o{ BIDDERS : pre_validates
    MOCK_PAN_RECORDS ||--o{ BIDDERS : pre_validates
    MOCK_UDYAM_RECORDS ||--o{ BIDDERS : pre_validates

    GOVERNMENT_EMPLOYEES {
        bigint id PK
        string employee_id UK
        string email UK
        string department_name
        string designation
    }

    OFFICERS {
        bigint id PK
        string name
        string email UK
        string mobile UK
        string password
        string department_name
        string role "ROLE_OFFICER"
        string verification_status "VERIFIED/NOT_VERIFIED"
        string digilocker_id
        timestamp identity_verified_at
        timestamp created_at
    }

    BIDDERS {
        bigint id PK
        string legal_name
        string authorized_person_name
        string company_name
        string email UK
        string phone
        string gst_number UK
        string password
        string role "BIDDER"
        boolean is_verified
        boolean gst_verified
        boolean pan_verified
        boolean udyam_verified
        timestamp created_at
    }

    TENDER_DOCUMENTS {
        bigint id PK
        string title
        text description
        string file_name
        string file_url
        string cloudinary_public_id
        bigint uploaded_by_officer_id FK
        string uploaded_by_email
        text raw_ocr_text
        text structured_data_json
        double authenticity_score
        boolean is_authentic
        string status "PROCESSED"
        timestamp created_at
    }

    BIDDER_DOCUMENTS {
        bigint id PK
        bigint bidder_id FK
        string file_name
        string document_type
        string file_url
        string cloudinary_public_id
        double ocr_confidence
        double authenticity_score
        boolean is_authentic
        string authenticity_verdict
        text verification_flags_json
        text raw_ocr_text
        string status "PROCESSED"
        timestamp created_at
    }

    BID_SUBMISSIONS {
        bigint id PK
        bigint bidder_id FK
        string bidder_name
        string company_name
        string tender_id FK
        string tender_title
        integer compliance_score
        string compliance_status
        string quoted_amount
        integer doc_count
        text documents_json
        string evaluation_status "Pending/Approved/Rejected"
        string officer_verdict
        text officer_remarks
        timestamp created_at
    }

    TENDER_EMBEDDINGS {
        bigint id PK
        string tender_id FK
        string title
        text content
        vector_768 embedding
        jsonb metadata
        timestamp created_at
    }

    BIDDER_EMBEDDINGS {
        bigint id PK
        string bidder_id FK
        string document_id FK
        string document_type
        text content
        vector_768 embedding
        jsonb metadata
        timestamp created_at
    }

    MOCK_GST_RECORDS {
        bigint id PK
        string gstin UK
        string legal_name
        string trade_name
        string status "ACTIVE"
    }

    MOCK_PAN_RECORDS {
        bigint id PK
        string pan UK
        string full_name
        string status "OPERATIVE"
    }

    MOCK_UDYAM_RECORDS {
        bigint id PK
        string udyam_number UK
        string enterprise_name
        string category "MICRO/SMALL/MEDIUM"
    }
```

---

## 10. Consolidated API Catalog & Endpoints

### 10.1 Commercial Bidder Authentication & Profile (`/api/bidder`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bidder/auth/signup` | Register company, check duplicate GSTIN, send Brevo OTP | None |
| `POST` | `/api/bidder/auth/verify-otp` | Verify 6-digit OTP, create DB user, issue Bearer JWT | None |
| `POST` | `/api/bidder/auth/resend-otp` | Re-dispatch registration OTP | None |
| `POST` | `/api/bidder/auth/login` | Authenticate bidder with email and password | None |
| `POST` | `/api/bidder/auth/verify-token` | Validate JWT token integrity and expiration | None |
| `POST` | `/api/bidder/auth/forgot-password`| Send password reset OTP | None |
| `POST` | `/api/bidder/auth/reset-password` | Finalize password reset with temporary reset token | None |
| `GET`  | `/api/bidder/{id}` | Fetch bidder organization profile | Bearer JWT |

### 10.2 Bidder Document Management & Vault (`/api/bidder/documents`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bidder/documents/upload` | Multipart upload to Cloudinary & run forensic ML checks | Bearer JWT |
| `GET`  | `/api/bidder/documents` | Retrieve all vault documents uploaded by authenticated bidder | Bearer JWT |
| `GET`  | `/api/bidder/documents/{id}` | Get specific document with OCR & authenticity details | Bearer JWT |
| `DELETE`| `/api/bidder/documents/{id}`| Remove document from database and Cloudinary storage | Bearer JWT |
| `POST` | `/api/bidder/documents/check-cis`| Pre-submission CIS compliance check against tender clauses | Bearer JWT |
| `POST` | `/api/bidder/documents/scan-taxpayer`| Multipart upload instant GSTIN/PAN scanner | Bearer JWT |
| `POST` | `/api/bidder/documents/verify-taxpayer`| Verify taxpayer identifier status via live GST portal | Bearer JWT |
| `POST` | `/api/bidder/documents/audit-submission`| Autonomous audit with GFR 173(i) MSE exemption rules | Bearer JWT |
| `POST` | `/api/bidder/documents/submit-bid`| Submit formal tender application with price quote | Bearer JWT |
| `GET`  | `/api/bidder/documents/my-bids`| Retrieve all submitted bids and real-time evaluation status | Bearer JWT |

### 10.3 Procurement Officer & Tender Management (`/api/officer/tenders`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/officer/auth/initiate` | Verify government employee ID (EMP101) & department | None |
| `POST` | `/api/officer/auth/signup` | Register officer and dispatch verification OTP | None |
| `POST` | `/api/officer/auth/login` | Officer sign-in returning `ROLE_OFFICER` JWT | None |
| `POST` | `/api/officer/auth/mock-verify` | Certify officer identity with MeriPehchaan/DigiLocker | None |
| `POST` | `/api/officer/tenders/upload` | Upload tender notice PDF, Cloudinary store & ML extract | Bearer JWT (Officer) |
| `GET`  | `/api/officer/tenders` | List tenders published by the logged-in officer | Bearer JWT (Officer) |
| `GET`  | `/api/officer/tenders/{id}` | Get tender details, raw OCR text & parsed requirements | Bearer JWT (Officer) |
| `DELETE`| `/api/officer/tenders/{id}`| Delete tender and associated Cloudinary assets | Bearer JWT (Officer) |
| `POST` | `/api/officer/tenders/{id}/compare-bidders`| Multi-bidder comparative evaluation matrix | Bearer JWT (Officer) |
| `GET`  | `/api/officer/tenders/{id}/top-bidders`| Ranked top bidders evaluated for a specific tender | Bearer JWT (Officer) |
| `GET`  | `/api/officer/tenders/submissions` | Retrieve all real-time bid submissions across tenders | Bearer JWT (Officer) |
| `GET`  | `/api/officer/tenders/{id}/submissions` | Retrieve submissions for a specific tender | Bearer JWT (Officer) |
| `PUT`  | `/api/officer/tenders/submissions/{subId}/evaluate`| Update evaluation status (Approved/Rejected) & remarks | Bearer JWT (Officer) |

### 10.4 Python ML Microservice (13 Endpoints at `http://20.40.44.184`)
| Endpoint | Method | Input / Mode | Functionality |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | Web Browser | Microservice status dashboard |
| `/health` | `GET` | None | Operational health & live GST portal ping |
| `/api/ml/document-types` | `GET` | None | 18 procurement doc categories & CIS weights |
| `/api/ml/process-document` | `POST` | Multipart PDF | OCR + Layout + Classification + NER + Tamper check |
| `/api/ml/automate-all` | `POST` | JSON payload | Master tender audit (Tender specs + Bidder profile) |
| `/api/ml/automate-all-files` | `POST`| Multipart Batch | Batch multi-document audit (PDFs + Tender notice) |
| `/api/ml/overall-summary` | `GET` | Query params | Single GET comprehensive dossier & RAG context |
| `/api/ml/verify-document` | `POST` | Multipart or JSON | pyHanko digital signatures + OpenCV stamp + QR decode |
| `/api/ml/verify-taxpayer` | `POST` | JSON (GSTIN/PAN) | Mod-36 checksum, state mapping & live GST lookup |
| `/api/ml/tender-requirements` | `POST`| JSON (Tender Text)| Dynamic 6-pillar parsing & GFR 173(i) MSE waivers |
| `/api/ml/process-clearance` | `POST` | JSON | Single-Click Clearance decision & risk scoring |
| `/api/ml/compliance/predict` | `POST` | JSON (9-D Vector)| Random Forest compliance verdict forecast |
| `/api/ml/train/all` | `POST` | JSON (Epochs) | Hot-reloading ML model retraining pipeline |

### 10.5 Node.js AI RAG & Gemini Chatbot
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`  | `/health` | RAG service and database connectivity check |
| `POST` | `/api/ai/tender/process` | Download tender PDF, chunk text, embed into `tender_embeddings` |
| `POST` | `/api/ai/bidder/process` | Vectorize bidder certificates into `bidder_embeddings` |
| `POST` | `/api/ai/bidder-tender-chat/ask` | Contextual question answering over Tender + Bidder context chunks |
| `POST` | `/api/ai/compare/chat` | Multi-bidder comparative tabular evaluation with Gemini 1.5 Pro |
| `POST` | `/api/ai/bidder-chat/ask` | Bidder-facing compliance and eligibility inquiry assistant |
| `POST` | `/api/ai/copilot/ask` | Global GeM CompliFlix AI platform copilot for procurement rules |

---

## 11. Statutory Compliance & Regulatory Rules Engine

GeM CompliFlix AI embeds Indian statutory public procurement regulations directly into its validation code:

### 11.1 General Financial Rules (GFR) 2017
- **Rule 144(xi)**: Mandatory restriction on procurement from countries sharing a land border with India. Bidders must upload a certified declaration confirming OEM and supply chain origin compliance.
- **Rule 151**: Automatic debarment filter cross-referencing national debarment / blacklist databases.
- **Rule 170 / 173(i)**: Statutory exemption of **EMD (Earnest Money Deposit)** and **Past Turnover / Experience** requirements for certified Micro & Small Enterprises (MSEs) and DPIIT-recognized Startups, provided technical competency is established.

### 11.2 DPIIT Public Procurement (Preference to Make in India) Order
- **Class-I Local Supplier**: Local content >= 50%. Entitled to purchase preference over non-local suppliers within the L1 + 20% margin.
- **Class-II Local Supplier**: Local content >= 20% but < 50%. Eligible to participate but no purchase preference.
- **Non-Local Supplier**: Local content < 20%. Excluded from domestic tenders up to INR 200 Crores (Rule 161(iv)).

### 11.3 Quality and Cost Based Selection (QCBS) Formula
For tenders requiring technical evaluation alongside commercial bids:
$$\text{Composite Score } (S) = (T_s \times W_t) + \left(\frac{C_{\text{low}}}{C} \times W_f \times 100\right)$$
Where:
- $T_s$ = Evaluated Technical Compliance Score (0–100)
- $W_t$ = Technical Weight (typically 0.70 or 70%)
- $C$ = Quoted Bid Price
- $C_{\text{low}}$ = Lowest Valid Commercial Offer (L-1)
- $W_f$ = Financial Weight (typically 0.30 or 30%)

---

## 12. Deployment, Infrastructure & Security

### 12.1 Infrastructure Topology
- **Frontend SPA**: React 18 + Vite deployed on **Vercel**.
- **Core Backend**: Spring Boot 3.x Docker container deployed on **Render**.
- **AI RAG Microservice**: Node.js + Express Docker container deployed on **Render**.
- **ML Microservice**: Python FastAPI / scikit-learn container deployed on **Azure Cloud VPS**.
- **Database**: PostgreSQL 16 on **NeonDB Serverless** with pooled HikariCP connections and `pgvector` enabled.
- **Media Assets**: **Cloudinary** secure storage bucket with access signed keys.

### 12.2 Security Best Practices Implemented
1. **Zero Root Privilege**: Multi-stage Docker containers execute under dedicated non-root users (`spring:spring` and `node:node`).
2. **Password Security**: Passwords hashed with BCrypt (strength 12) with zero plaintext persistence.
3. **Dual JWT Filters**: Strict cryptographic validation of Bearer tokens with separate subject parsing for officers and commercial bidders.
4. **Rate Limiting**: Sliding window rate limiting on sensitive authentication routes (`RateLimiterFilter` - 5 requests / 60 seconds per IP) to mitigate brute force attacks.
5. **CORS Governance**: Configured Cross-Origin Resource Sharing with whitelisted origins, credential sharing, and 3600-second preflight caching.
6. **Statutory Non-Repudiation**: Officer clearance actions recorded with unique timestamped clearance IDs and audit trail remarks.

---

## 13. Testing, Verification & Quality Assurance Suite

The project includes automated regression testing and validation suites:
- **Client Testing Framework**: Jest 29 + Babel + React Testing Library configured in `Client/jest.config.cjs`.
- **Unit & Integration Tests**:
  - `tenderComparisonAdapter.test.js`: Verifies transformation of complex ML matrices into UI comparison tables.
  - `documentService.test.js`: Validates multipart file uploads, error handling, and Cloudinary response parsing.
  - `tenderService.test.js`: Tests real-time bid fetching, ranking computations, and status filtering.
  - `roleUtils.test.js`: Confirms strict RBAC boundary checks between officers and bidders.
  - `DocumentPreviewModal.test.jsx`: Tests blob URL generation, SHA-256 copy action, and tab switching.
- **Code Quality**: ESLint configuration enforcing ECMAScript modern standards and strict React hooks lint rules.

*Authored for the Smart India Hackathon (SIH) 2026 Evaluation Committee — GeM CompliFlix Engineering Team.*

