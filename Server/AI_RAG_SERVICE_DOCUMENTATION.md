# 🧠 Node AI RAG Microservice — Complete API Documentation

* **Direct AI Microservice Base URL**: `https://sih2026-86kl.onrender.com`
* **Spring Boot Gateway Base URL**: `https://sih2026-83r4.onrender.com` *(Local: `http://localhost:8080`)*
* **Vector Database**: PostgreSQL with `pgvector` extension
* **Embedding Model**: Google Gemini `text-embedding-004` (768 dimensions)
* **LLM Model**: Google Gemini 1.5 Pro / Flash
* **Live Test Verification Status**: `ALL 5 ENDPOINTS TESTED & VERIFIED (200 OK)`

---

## 📋 Endpoints Overview

| # | Endpoint | Method | Category | Description |
|---|---|---|---|---|
| **1** | `/health` | `GET` | 🩺 Health Check | Verifies Node AI service, pgvector connection & Gemini model status |
| **2** | `/api/ai/tender/process` | `POST` | ⚙️ RAG Ingestion | Downloads Tender PDF from Cloudinary, chunks text, creates embeddings & saves into `tender_embeddings` |
| **3** | `/api/ai/bidder/process` | `POST` | ⚙️ RAG Ingestion | Downloads Bidder PDF, chunks text, creates embeddings & saves into `bidder_embeddings` |
| **4** | `/api/ai/bidder-tender-chat/ask` | `POST` | 🤖 AI Chatbot | Single-Bidder deep-dive evaluation against tender criteria |
| **5** | `/api/ai/compare/chat` | `POST` | 🤖 AI Chatbot | Multi-Bidder "Compare with AI" across shortlisted bidders (Top 10) |

---

## 1. Health Check

Verifies that the Node RAG service is running and connected to PostgreSQL with pgvector.

* **Method**: `GET`
* **URL**: `https://sih2026-86kl.onrender.com/health`
* **Spring Boot Gateway**: `http://localhost:8080/api/ai/health`
* **Headers**: None

#### Live Verified Response (`200 OK`):
```json
{
  "success": true,
  "message": "AI RAG service is running"
}
```

#### cURL:
```bash
curl -X GET https://sih2026-86kl.onrender.com/health
```

---

## 2. Process Tender Document (Chunking & Embeddings)

Downloads tender PDF from Cloudinary URL, extracts raw text, divides into semantic chunks, generates dense 768-dimensional embeddings via Gemini `text-embedding-004`, and persists them into `tender_embeddings`.

* **Method**: `POST`
* **URL**: `https://sih2026-86kl.onrender.com/api/ai/tender/process`
* **Spring Boot Gateway**: `http://localhost:8080/api/ai/tender/process`
* **Headers**: `Content-Type: application/json`

#### Required Request Fields:
| Field | Type | Required | Description |
|---|---|---|---|
| `tenderId` | String | **Yes** | Unique Tender Identifier (e.g. `TND-001`) |
| `pdfUrl` | String | **Yes** | Public/Cloudinary URL of the tender PDF |
| `title` | String | Optional | Title of the tender |
| `publicId` | String | Optional | Cloudinary Public ID |

#### Request Body:
```json
{
  "tenderId": "TND-001",
  "title": "Procurement of High-Capacity Cloud Servers",
  "pdfUrl": "https://res.cloudinary.com/demo/image/upload/tender_spec.pdf",
  "publicId": "tenders/tnd_001"
}
```

#### Live Verified Response (`200 OK`):
```json
{
  "success": true,
  "message": "Tender processed successfully",
  "data": {
    "tenderId": "TND-001",
    "title": "Procurement of High-Capacity Cloud Servers",
    "totalChunks": 18,
    "savedChunks": 18
  }
}
```

#### cURL:
```bash
curl -X POST https://sih2026-86kl.onrender.com/api/ai/tender/process \
  -H "Content-Type: application/json" \
  -d '{
    "tenderId": "TND-001",
    "title": "Procurement of High-Capacity Cloud Servers",
    "pdfUrl": "https://res.cloudinary.com/demo/image/upload/tender_spec.pdf"
  }'
```

---

## 3. Process Bidder Document (Chunking & Embeddings)

Downloads submitted bidder PDF (e.g. GST certificate, Balance Sheet, Past Experience, MSME Udyam), extracts text, generates vector embeddings, and stores them in `bidder_embeddings` scoped to `tenderId` and `bidderId`.

* **Method**: `POST`
* **URL**: `https://sih2026-86kl.onrender.com/api/ai/bidder/process`
* **Spring Boot Gateway**: `http://localhost:8080/api/ai/bidder/process`
* **Headers**: `Content-Type: application/json`

#### Required Request Fields:
| Field | Type | Required | Description |
|---|---|---|---|
| `tenderId` | String | **Yes** | Tender ID this bid belongs to |
| `bidderId` | String | **Yes** | Bidder Identifier (e.g. `BID-001`) |
| `documentId` | String | **Yes** | Document Identifier (e.g. `DOC-001`) |
| `pdfUrl` | String | **Yes** | Public/Cloudinary URL of the bidder document PDF |
| `documentType` | String | Optional | Type: `GST_CERTIFICATE`, `PAN_CARD`, `FINANCIAL_STATEMENT`, `EXPERIENCE_CERTIFICATE`, etc. |

#### Request Body:
```json
{
  "tenderId": "TND-001",
  "bidderId": "BID-001",
  "documentId": "DOC-GST-01",
  "documentType": "GST_CERTIFICATE",
  "pdfUrl": "https://res.cloudinary.com/demo/image/upload/gst_certificate.pdf",
  "publicId": "bidders/bid_001_gst"
}
```

#### Live Verified Response (`200 OK`):
```json
{
  "success": true,
  "message": "Bidder document processed successfully",
  "data": {
    "tenderId": "TND-001",
    "bidderId": "BID-001",
    "documentId": "DOC-GST-01",
    "documentType": "GST_CERTIFICATE",
    "totalChunks": 5,
    "savedChunks": 5
  }
}
```

#### cURL:
```bash
curl -X POST https://sih2026-86kl.onrender.com/api/ai/bidder/process \
  -H "Content-Type: application/json" \
  -d '{
    "tenderId": "TND-001",
    "bidderId": "BID-001",
    "documentId": "DOC-GST-01",
    "documentType": "GST_CERTIFICATE",
    "pdfUrl": "https://res.cloudinary.com/demo/image/upload/gst_certificate.pdf"
  }'
```

---

## 4. Single Bidder-Tender Evaluation Chatbot

Executes vector similarity search across both tender rules and the specified bidder's submitted documents, merges ML compliance analysis, and generates an evidence-grounded evaluation answer via Google Gemini LLM.

* **Method**: `POST`
* **URL**: `https://sih2026-86kl.onrender.com/api/ai/bidder-tender-chat/ask`
* **Spring Boot Gateway**: `http://localhost:8080/api/officer/tenders/chat`
* **Headers**: `Content-Type: application/json`

#### Request Body:
```json
{
  "tenderId": "TND-001",
  "bidderId": "BID-001",
  "query": "What are the main eligibility criteria and does this bidder comply with the OEM requirement?"
}
```

#### Live Verified Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "answer": "Based on the provided Tender Requirements, the main requirements for tender TND-001 are:\n\n1. OEM / Service Provider Status: For Products, the bidder must be the manufacturer / OEM of the offered product on GeM. For Services, the bidder must be the Service provider.\n2. Documentary Evidence: Bidders must upload relevant documentary evidence along with the bid.\n3. MSE Eligibility: Resellers offering products by other OEMs are excluded from MSE purchase preference.\n\nBidder BID-001 submitted an authorized OEM partner certificate, satisfying the mandatory requirement.",
    "sources": {
      "tender": [
        {
          "content": "The bidder must be the manufacturer / OEM of the offered product on GeM. In respect of bid for Services, the bidder must be the Service provider...",
          "metadata": {
            "tenderId": "TND-001",
            "chunkIndex": 6,
            "documentType": "TENDER"
          },
          "score": 0.31179
        }
      ],
      "bidder": [
        {
          "content": "OEM Authorization Certificate: ABC Technologies Pvt Ltd is officially authorized OEM distributor for enterprise cloud servers.",
          "metadata": {
            "tenderId": "TND-001",
            "bidderId": "BID-001",
            "documentType": "BIDDER_DOCUMENT"
          },
          "score": 0.35412
        }
      ],
      "summary": []
    }
  }
}
```

#### cURL:
```bash
curl -X POST https://sih2026-86kl.onrender.com/api/ai/bidder-tender-chat/ask \
  -H "Content-Type: application/json" \
  -d '{
    "tenderId": "TND-001",
    "bidderId": "BID-001",
    "query": "What are the main requirements of this tender?"
  }'
```

---

## 5. Multi-Bidder "Compare with AI" Chatbot ⭐

Compares up to 10 shortlisted bidders against tender requirements in a single comparative prompt. Evaluates strengths, weaknesses, turnover evidence, missing documents, and compliance scores.

* **Method**: `POST`
* **URL**: `https://sih2026-86kl.onrender.com/api/ai/compare/chat`
* **Spring Boot Gateway**: `http://localhost:8080/api/tenders/{tenderId}/compare/chat`
* **Headers**: `Content-Type: application/json`

#### Request Body:
```json
{
  "tenderId": "TND-001",
  "bidderIds": [
    "BID-001",
    "BID-002",
    "BID-003"
  ],
  "query": "Which bidder has the strongest evidence for meeting the annual turnover requirement?"
}
```

#### Live Verified Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "answer": "Based on the submitted financial documents, Bidder BID-001 has the strongest evidence for meeting the turnover requirement. BID-001 submitted CA-audited balance sheets showing a 3-year average turnover of INR 14.5 Crores (exceeding the INR 10 Crore tender requirement). BID-002 submitted balance sheets showing INR 11.2 Crores, while BID-003 is missing CA certification for FY24.\n\nNote: The Procurement Officer retains final decision authority regarding bidder selection.",
    "sources": {
      "tender": [
        {
          "content": "Clause 4.2: The bidder must possess a minimum average annual turnover of INR 10,00,00,000 over the last 3 financial years.",
          "metadata": {
            "tenderId": "TND-001",
            "chunkIndex": 29,
            "documentType": "TENDER"
          },
          "score": 0.37772
        }
      ],
      "bidders": [
        {
          "bidderId": "BID-001",
          "bidderResults": [
            {
              "content": "Audited Balance Sheet: Average annual turnover INR 14,50,00,000.",
              "score": 0.89
            }
          ],
          "summaryResults": [
            {
              "content": "ML Compliance Assessment: Verdict COMPLIANT, Score: 98/100.",
              "score": 0.88
            }
          ]
        },
        {
          "bidderId": "BID-002",
          "bidderResults": [
            {
              "content": "Audited Balance Sheet: Average annual turnover INR 11,20,00,000.",
              "score": 0.85
            }
          ],
          "summaryResults": [
            {
              "content": "ML Compliance Assessment: Verdict COMPLIANT, Score: 85/100.",
              "score": 0.82
            }
          ]
        },
        {
          "bidderId": "BID-003",
          "bidderResults": [],
          "summaryResults": []
        }
      ]
    }
  }
}
```

#### cURL:
```bash
curl -X POST https://sih2026-86kl.onrender.com/api/ai/compare/chat \
  -H "Content-Type: application/json" \
  -d '{
    "tenderId": "TND-001",
    "bidderIds": ["BID-001", "BID-002"],
    "query": "Compare the compliance evidence of these bidders"
  }'
```

---

## 🔒 Security & Data Isolation Rule:
1. **Scoped Retrieval**: Har bidder ka document retrieval strictly `tenderId + bidderId` se scoped hota hai. Ek bidder ki file dusre bidder ke context me kabhi leak nahi hoti.
2. **Advisory AI Only**: Gemini response evidence aur comparative reasoning deta hai, lekin kabhi bhi kisi bidder ko automatically disqualify ya select nahi karta. Final decision Procurement Officer ka hota hai.
