# 🧠 Node AI RAG Microservice — Complete API Documentation

**Microservice Name**: `ai-rag-service`  
**API Version**: `1.0.0`  
**Direct AI RAG Base URL (Render)**: `https://sih2026-86kl.onrender.com`  
**Spring Boot Gateway (Local)**: `http://localhost:8080/api/officer/tenders`  
**Spring Boot Gateway (Production)**: `https://sih2026-83r4.onrender.com/api/officer/tenders`  
**Vector Database**: PostgreSQL with `pgvector` extension (HNSW cosine similarity indexing)  
**Embedding Model**: Google Gemini `text-embedding-004` (768 dimensions)  
**LLM Inference Model**: Google Gemini 1.5 Pro / Flash with factual source citation anchoring

---

## 1. System Architecture & End-to-End Workflow

```
[Procurement Officer (React UI)]
               │
               ▼
[Spring Boot Backend Gateway]
               │
               ▼
[Node AI RAG Service: https://sih2026-86kl.onrender.com]
               │
   ┌───────────┴───────────┐
   ▼                       ▼
1. pgvector Search     2. Python ML Context
   (Tender & Bidder)      (CIS score, GSTIN check)
   └───────────┬───────────┘
               ▼
3. Gemini LLM Reasoning (Grounds response in retrieved chunks)
               │
               ▼
4. Formatted Answer + Exact Document Source Citations
```

---

## 2. API Endpoints Specification

### 2.1 Health Check
Verifies operational status of the Node AI RAG service and database connectivity.

* **Method**: `GET`
* **Direct AI URL**: `https://sih2026-86kl.onrender.com/health`
* **Spring Boot Gateway URL**: `http://localhost:8080/api/officer/tenders/rag-health`
* **Headers**: `None required`
* **Success Response (`200 OK`)**:
```json
{
  "status": "UP",
  "service": "node-ai-rag-service",
  "vectorDatabase": "pgvector (Neon DB)",
  "embeddingModel": "text-embedding-004",
  "llmModel": "gemini-1.5-pro"
}
```

---

### 2.2 Process Tender PDF (Chunking & Embeddings)
Extracts raw text from the specified Tender NIT/BQC document, divides into semantically coherent chunks (500 tokens with 10% overlap), generates dense embeddings via Gemini `text-embedding-004`, and inserts vectors into PostgreSQL table `tender_embeddings`.

* **Method**: `POST`
* **Direct AI URL**: `https://sih2026-86kl.onrender.com/api/ai/tender/process`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "tenderId": "TND-001"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "tenderId": "TND-001",
  "chunksIndexed": 18,
  "embeddingDimension": 768,
  "status": "EMBEDDINGS_STORED",
  "message": "Tender document processed, chunked and stored in pgvector successfully"
}
```

---

### 2.3 Process Bidder PDF (Chunking & Embeddings)
Ingests bidder submission documents (e.g., GST Certificate, Balance Sheet, Past Experience Certificates, MSME Udyam), extracts text, generates vector embeddings, and stores them in `bidder_embeddings` linked to `tenderId` and `bidderId`.

* **Method**: `POST`
* **Direct AI URL**: `https://sih2026-86kl.onrender.com/api/ai/bidder/process`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "tenderId": "TND-001",
  "bidderId": "BID-007",
  "documentId": "DOC-001",
  "documentType": "GST_CERTIFICATE"
}
```
* **Supported Document Types**: `GST_CERTIFICATE`, `PAN_CARD`, `FINANCIAL_STATEMENT`, `INCOME_TAX_RETURN`, `EXPERIENCE_CERTIFICATE`, `MSME_CERTIFICATE`, `OTHER`
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "tenderId": "TND-001",
  "bidderId": "BID-007",
  "documentId": "DOC-001",
  "documentType": "GST_CERTIFICATE",
  "chunksIndexed": 6,
  "status": "EMBEDDINGS_STORED",
  "message": "Bidder document indexed into vector store successfully"
}
```

---

### 2.4 Ask Bidder-Tender Chatbot ⭐ (Core Evaluation Chat API)
Main Q&A interface for Procurement Officers. Given a specific query, the service executes hybrid vector retrieval across both tender criteria and bidder submissions, merges the Python ML summary verdict, constructs an augmented prompt, and queries Google Gemini LLM to produce a factual, cited response.

* **Method**: `POST`
* **Direct AI URL**: `https://sih2026-86kl.onrender.com/api/ai/bidder-tender-chat/ask`
* **Spring Boot Gateway URL**: `http://localhost:8080/api/officer/tenders/chat` (or `http://localhost:8080/api/officer/tenders/{tenderId}/chat`)
* **Headers**: 
  * `Authorization: Bearer <OFFICER_JWT_TOKEN>` *(when calling Spring Boot)*
  * `Content-Type: application/json`
* **Request Body**:
```json
{
  "tenderId": "TND-001",
  "bidderId": "BID-007",
  "query": "Does this bidder meet the minimum turnover requirement of INR 10 Crores?"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "answer": "Yes, bidder BID-007 satisfies the minimum turnover criteria. As per the uploaded FY2024-25 Financial Audit Statement (Page 3), the verified average annual turnover is INR 14.5 Crores, exceeding the required threshold of INR 10 Crores stipulated in Clause 4.2 of the Tender Specification.",
  "sources": [
    {
      "documentType": "FINANCIAL_STATEMENT",
      "fileName": "financial_audit_fy2425.pdf",
      "pageNumber": 3,
      "similarityScore": 0.89,
      "matchedSnippet": "Annual Turnover FY2024-25: INR 14,50,00,000 (Fourteen Crores Fifty Lakhs)"
    },
    {
      "documentType": "TENDER_SPEC",
      "clause": "Clause 4.2 - Financial Eligibility Criteria",
      "similarityScore": 0.93,
      "matchedSnippet": "The bidder must possess a minimum average annual turnover of INR 10,00,00,000 over the last 3 financial years."
    }
  ],
  "tenderId": "TND-001",
  "bidderId": "BID-007",
  "confidenceScore": 0.96
}
```

---

## 3. Postman / cURL Quick Examples

### Ask Chatbot via Spring Boot Gateway:
```bash
curl -X POST http://localhost:8080/api/officer/tenders/chat \
  -H "Authorization: Bearer YOUR_OFFICER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenderId": "TND-001",
    "bidderId": "BID-007",
    "query": "Is the GSTIN active and does this bidder have any blacklisting history?"
  }'
```

### Direct RAG Chatbot Call:
```bash
curl -X POST https://sih2026-86kl.onrender.com/api/ai/bidder-tender-chat/ask \
  -H "Content-Type: application/json" \
  -d '{
    "tenderId": "TND-001",
    "bidderId": "BID-007",
    "query": "Summarize the technical past experience of this bidder."
  }'
```
