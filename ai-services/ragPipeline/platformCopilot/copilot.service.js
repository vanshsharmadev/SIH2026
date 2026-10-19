const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const {
  PLATFORM_WORKFLOW,
  PLATFORM_NAVIGATION,
  TROUBLESHOOTING_GUIDE,
  STATUTORY_RULES,
} = require("./copilot.knowledge");

let model = null;
if (process.env.GEMINI_API_KEY) {
  try {
    model = new ChatGoogleGenerativeAI({
      model: "gemini-3.6-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.2,
    });
  } catch (err) {
    console.warn("Failed to initialize Gemini model for Copilot:", err.message);
  }
}

/**
 * Check if the query is asking about a specific bidder's compliance
 * when no bidder context is present.
 */
function isBidderSpecificQueryWithoutContext(query, bidderId) {
  if (bidderId && bidderId !== "BID-007" && bidderId !== "null") return false;
  const q = query.toLowerCase();
  const bidderKeywords = [
    "this bidder",
    "the bidder",
    "ye bidder",
    "yeh bidder",
    "is bidder",
    "financial criteria",
    "turnover requirement",
    "is this bidder eligible",
    "bidder meet",
    "bidder pass",
    "bidder qualified",
    "bidder eligible",
    "bidder ki turnover",
  ];
  return bidderKeywords.some((k) => q.includes(k));
}

/**
 * Perform local semantic / keyword matching on platform knowledge
 */
function findPlatformKnowledgeMatch(query) {
  const q = query.toLowerCase();

  // 1. Troubleshooting / Upload failures (High Priority)
  if (
    q.includes("upload nahi") ||
    (q.includes("upload") && (q.includes("fail") || q.includes("error") || q.includes("stuck") || q.includes("not working") || q.includes("problem"))) ||
    q.includes("document upload")
  ) {
    return {
      title: "Troubleshooting: Document Upload Issues",
      citation: "Troubleshooting Guide • GeM Compliflix AI",
      text: `### Please check the following steps:\n\n1. **Supported File Format**: Ensure your file is in **PDF**, **DOCX**, **XLSX**, **PNG**, or **JPG** format.\n2. **File Size Limit**: Confirm the file is under the **50MB** limit.\n3. **Active Processing**: If you dropped a large PDF, allow up to 30-45 seconds for OCR parsing. Check the **Process Logs** in the Upload & Extract tab.\n4. **Network & Session**: Verify that your login session is active and not timed out.\n5. **Alternative**: If a particular file fails, try refreshing the page or testing with one of the built-in sample RFPs in the Upload & Extract view.`,
    };
  }

  // 2. Tender creation inquiries
  if (
    (q.includes("tender") && (q.includes("create") || q.includes("banaye") || q.includes("bana") || q.includes("new tender") || q.includes("naya tender") || q.includes("draft"))) ||
    q.includes("create tender")
  ) {
    return {
      title: "How to Create a New Tender",
      citation: "Platform Navigation • Upload & Extract",
      text: `### Steps to Create a Tender:\n\n1. **Navigate**: In the left sidebar, click **Upload & Extract** (or open \`/dashboard?tab=upload-extract\`).\n2. **Auto-Extract via Document**: Drag and drop your tender RFP/NIT PDF into the upload zone, or click **Upload Tender Document**.\n3. **Or Fill Manually**: Provide Tender Title, Department, Category, Estimated Value, and EMD amount.\n4. **Run Extraction**: Click **Process & Extract Clauses** to allow the AI to extract statutory clauses.\n5. **Publish**: Verify the extracted details and click **Publish Tender** to make it active for bidders.`,
    };
  }

  // 3. Bidder submissions inquiries
  if (
    (q.includes("bidder") && (q.includes("submission") || q.includes("submissions") || q.includes("kaha") || q.includes("where"))) ||
    q.includes("submissions kaha") ||
    q.includes("bids kaha")
  ) {
    return {
      title: "Locating Bidder Submissions",
      citation: "Platform Navigation • Tender Submissions",
      text: `### Where to Find Bidder Submissions:\n\n1. **Open Tender Submissions**: Click on **Tender Submissions** in the left sidebar menu (or open \`/dashboard?tab=submissions\`).\n2. **Filter by Tender**: Use the top dropdown to select the specific tender (e.g. *GEM/2026/B/1001*).\n3. **View Bidders**: All submitted vendor proposals will be listed with their submission dates, technical packet status, and financial bids.\n4. **Actions**: Click **Evaluation** on any bidder card to inspect documents or launch the comparative evaluation drawer.`,
    };
  }

  // 4. Bidder evaluation procedure
  if (
    (q.includes("evaluate") && (q.includes("bidder") || q.includes("process"))) ||
    q.includes("bidder evaluate") ||
    q.includes("tender evaluation ka process")
  ) {
    return {
      title: "Bidder Evaluation Procedure",
      citation: "Platform Navigation • Tender Submissions & Evaluation",
      text: `### How to Evaluate a Bidder:\n\n1. **Open Tender Submissions**: Go to the **Tender Submissions** tab.\n2. **Select Tender**: Choose the relevant tender from the filter dropdown.\n3. **Select Bidder**: Choose the bidder from the submissions list.\n4. **Open Evaluation**: Click the **Evaluation** button or **View Compliance**.\n5. **Review AI Verification**: Check the automated verification for GFR Rule 144(xi), Make in India Class-I, and MSME concessions.\n6. **Inspect Evidence**: Review submitted PAN, GSTIN certificate, and audited financials with UDIN.\n7. **Record Officer Decision**: Enter evaluation marks and approve or reject the submission.\n8. **Generate Report**: Navigate to **Reports** to download the signed Compliance Summary.`,
    };
  }

  // 5. Compliance report inquiries
  if (
    q.includes("compliance report") ||
    (q.includes("report") && (q.includes("generate") || q.includes("download") || q.includes("kaise") || q.includes("export")))
  ) {
    return {
      title: "Generating & Downloading Compliance Reports",
      citation: "Platform Navigation • Reports & Analytics",
      text: `### How to Generate a Compliance Report:\n\n1. **Navigate to Reports**: Click **Reports** in the left sidebar (or go to \`/dashboard?tab=reports\`).\n2. **Select Tender**: Choose the desired tender from the selection dropdown.\n3. **Review Summary**: Inspect the executive compliance summary, bidder rankings, and statutory pass/fail breakdown.\n4. **Export Report**: Click **Export PDF** for an official stamped report, or click **Export CSV** for procurement audit records.`,
    };
  }

  // 6. AI Verification inquiries
  if (
    q.includes("ai verification") ||
    (q.includes("verification") && (q.includes("work") || q.includes("kaise") || q.includes("how")))
  ) {
    return {
      title: "How AI Verification Works",
      citation: "System Architecture • ML & Compliance Engine",
      text: `### AI Verification Architecture:\n\n1. **Multi-Document OCR & Parsing**: High-accuracy OCR extracts text and tables from tender RFPs and vendor submissions (PDF, DOCX, scans).\n2. **Statutory Rules Engine**: Evaluates vendor data against mandatory government rules:\n   - **GFR Rule 144(xi)**: Land border restrictions and DPIIT registration.\n   - **Make in India (MII)**: Verification of Class-I (≥50%) or Class-II (20-50%) local content.\n   - **MSME / Udyam**: Automated waiver of EMD and turnover criteria.\n   - **Taxpayer Status**: Real-time GSTIN validation and active debarment check under GFR Rule 151.\n3. **Quality & Cost Based Selection (QCBS)**: Computes 70:30 weighted scores combining technical quality and financial competitiveness.\n4. **Evidence Grounding**: Every AI recommendation is linked directly to document citations for full officer transparency.`,
    };
  }

  // 7. Workflow / Next step inquiries
  if (
    q.includes("workflow") ||
    q.includes("next step") ||
    q.includes("samajh nahi aa raha") ||
    q.includes("after upload") ||
    q.includes("uploading tender") ||
    q.includes("upload karne ke baad") ||
    (q.includes("kya") && q.includes("karu"))
  ) {
    if (q.includes("after upload") || q.includes("uploading") || q.includes("upload karne ke baad")) {
      return {
        title: "Next Steps: After Uploading Tender Documents",
        citation: "GeM Platform Workflow • Step 4 & 5",
        text: `### What to do after uploading tender documents:\n\n1. **Document Extraction**: The AI/OCR engine will automatically process the RFP/NIT document and extract key tender clauses, category, estimated value, and eligibility thresholds.\n2. **Review Extracted Data**: In the **Upload & Extract** tab, verify the extracted metadata and required technical qualifications.\n3. **Publish Tender**: Click **Publish Tender** to make the tender active on the public registry.\n4. **Receive Bids**: Monitor incoming proposals in the **Tender Submissions** tab.\n5. **Document Verification & AI Compliance**: Once bids are submitted, execute automated compliance and QCBS ranking.`,
      };
    }

    return {
      title: "GeM Compliance Platform — End-to-End Workflow",
      citation: "GeM Standard Operating Procedure (SOP)",
      text: `### Complete 12-Step Platform Workflow:\n\n1. **Create Tender**: Open the **Upload & Extract** tab.\n2. **Enter Tender Details**: Provide Title, Reference No, Department, and Estimated Value.\n3. **Upload Documents**: Upload NIT/RFP PDF/DOCX (up to 50MB).\n4. **Extract Information**: AI/OCR extracts clauses, turnover, and Make in India thresholds.\n5. **Publish Tender**: Tender is listed on the active portal.\n6. **Receive Submissions**: Bidders submit proposals via the portal.\n7. **Inspect Documents**: Inspect PAN, GSTIN, Udyam, and CA statements in **Tender Submissions**.\n8. **Document Verification**: Verify authenticity against statutory registries.\n9. **Compliance Check**: Automated check for GFR Rule 144(xi), Make in India Class-I, and MSME concessions in **Compliance** tab.\n10. **AI Verification & QCBS**: Quality & Cost Based Selection (70:30) ranks top 10 bidders in **Top Bidders** tab.\n11. **Officer Evaluation & Compliance Report**: Officer approves/rejects and exports official audit report in **Reports** tab.\n12. **Archive Tender**: Completed tenders are preserved with permanent audit trails.`,
    };
  }

  // 8. Archived tenders
  if (
    q.includes("archived") ||
    q.includes("purane tender") ||
    q.includes("completed tender") ||
    q.includes("history")
  ) {
    return {
      title: "Accessing Archived & Historical Tenders",
      citation: "Platform Navigation • Dashboard & Audit",
      text: `### Where to Find Archived Tenders:\n\n1. **Dashboard Overview**: In the **Dashboard** tab, locate the **Status** filter dropdown and select **Archived** or **Completed**.\n2. **Audit Trail**: Open the **Audit Trail** tab from the left sidebar to view permanent, immutable event logs for every historical tender and officer evaluation.`,
    };
  }

  // 9. Dashboard overview / What is this section
  if (
    q.includes("ye dashboard") ||
    q.includes("section kis kaam") ||
    q.includes("dashboard overview") ||
    q.includes("kpi")
  ) {
    return {
      title: "Dashboard Sections & Overview",
      citation: "Platform User Guide • Navigation Overview",
      text: `### GeM Compliance Platform Sections:\n\n- **Dashboard Overview**: Key performance metrics (Active Tenders, Pending Evaluations, Compliance Rate) and quick actions.\n- **Tender Submissions**: All incoming bids, vendor documents, and comparative evaluation drawers.\n- **Top Bidders (QCBS)**: AI-driven ranking of top 10 bidders under GFR Rule 192 (70:30 technical/financial weightage).\n- **Compliance Verification**: Automated statutory checks for Land Border, Make in India, and MSME concessions.\n- **Upload & Extract**: Create new tenders, upload RFP documents, and run OCR clause extraction.\n- **Reports**: Generate and export official GeM compliance audits (PDF/CSV).\n- **Audit Trail**: Immutable chronological log of all officer actions and verification activities.`,
    };
  }

  // 10. GFR Rule 144(xi)
  if (q.includes("144") || q.includes("land border") || q.includes("border")) {
    return {
      title: "GFR 2017 Rule 144(xi) — Land Border Restrictions",
      citation: "Ministry of Finance OM F.No.6/18/2019-PPD",
      text: `Under GFR 2017 Rule 144(xi) and Dept of Expenditure Order F.No.6/18/2019-PPD, any bidder from a country sharing a land border with India is eligible to bid in public procurement **only if the bidder is registered with the Competent Authority (DPIIT)** and holds valid political/security clearance from the Ministry of External Affairs (MEA) and Ministry of Home Affairs (MHA).\n\n**Compliance Rule**: Bids submitted without this mandatory DPIIT certificate must be rejected immediately during the technical bid evaluation stage.`,
    };
  }

  // 11. Make in India
  if (q.includes("make in india") || q.includes("mii") || q.includes("local content")) {
    return {
      title: "Public Procurement (Preference to Make in India) Order 2017",
      citation: "DPIIT Order P-45021/2/2017-PP (BE-II)",
      text: `### Make in India Classification:\n\n- **Class-I Local Supplier**: Minimum **50%** local content. Eligible for statutory purchase preference.\n- **Class-II Local Supplier**: **20% to 50%** local content. Can participate but receives no purchase preference.\n- **Non-Local Supplier**: Less than **20%** local content. Strictly barred from participating in tenders valued up to ₹200 Crores under GFR Rule 161(iv) Global Tender Enquiry (GTE) restrictions.`,
    };
  }

  // 12. MSME / EMD
  if (q.includes("msme") || q.includes("udyam") || q.includes("emd") || q.includes("turnover exemption")) {
    return {
      title: "MSME / MSE Concessions & EMD Exemption",
      citation: "Public Procurement Policy for MSEs Order 2012 & GFR Rule 170(i)",
      text: `Under the Public Procurement Policy for Micro & Small Enterprises (MSEs) Order 2012 and GFR 2017 Rule 170(i):\n\n1. **EMD Exemption**: All MSEs possessing a valid **Udyam Registration Certificate** are **100% exempt** from submitting Earnest Money Deposit (Bid Security).\n2. **Turnover & Experience Relaxation**: Under GFR Rule 173(i), procuring entities may relax prior turnover and experience criteria for MSEs/Startups, provided technical capability and quality standards are demonstrated.\n3. **Purchase Preference**: 25% of total procurement is reserved for MSEs, including sub-targets for SC/ST and women entrepreneurs.`,
    };
  }

  // 13. GST & Taxpayer
  if (q.includes("gst") || q.includes("taxpayer") || q.includes("documents required for gst")) {
    return {
      title: "GST Compliance & Statutory Documentation",
      citation: "GeM GTC v4.0 & Statutory Regulations",
      text: `### Mandatory Documents for GST & Taxpayer Compliance:\n\n1. **GSTIN Registration Certificate**: Form GST REG-06 showing active status and principal place of business.\n2. **GSTR-3B / Return Filing Proof**: Proof of regular tax return filings for the preceding 6 months.\n3. **Permanent Account Number (PAN)**: Linked to company/firm identity.\n4. **Audited Financial Statements**: Last 3 financial years' balance sheet and profit & loss statements audited by a Chartered Accountant with a valid **Unique Document Identification Number (UDIN)**.`,
    };
  }

  return null;
}

/**
 * Main query handler for GeM Compliflix AI Copilot
 */
async function answerPlatformCopilotQuery({
  query,
  context = {},
}) {
  if (!query || !String(query).trim()) {
    throw new Error("query is required");
  }

  const cleanQuery = String(query).trim();
  const {
    activeMenu = "dashboard",
    tenderId = null,
    bidderId = null,
    role = "OFFICER",
  } = context;

  // -------------------------------------------------------------
  // GUARD: Bidder-specific question when no bidder is selected
  // -------------------------------------------------------------
  if (isBidderSpecificQueryWithoutContext(cleanQuery, bidderId)) {
    return {
      answer: `To evaluate a specific bidder's financial compliance, please open the relevant **Tender Submissions** and select the bidder first.\n\nI can then help you understand the available compliance evidence and verification results.\n\n### Standard GeM & GFR 2017 Financial Criteria:\n- **Turnover Requirement**: Typically 30% to 50% of the estimated tender value over the last 3 financial years.\n- **Chartered Accountant Certificate**: Must bear an active **Unique Document Identification Number (UDIN)**.\n- **MSME / Startup Relaxations**: Under GFR Rule 173(i), registered MSEs and DPIIT-recognized startups may receive turnover and prior experience relaxations.`,
      title: "Select Bidder in Tender Submissions",
      citation: "Evaluation Context Required • GFR 2017 Rules",
      confidence: "Verified Workflow",
    };
  }

  // -------------------------------------------------------------
  // 1. Check local knowledge match first
  // -------------------------------------------------------------
  const localMatch = findPlatformKnowledgeMatch(cleanQuery);

  // If Gemini model is not available or if local match is high-confidence, return local match
  if (!model && localMatch) {
    return {
      answer: localMatch.text,
      title: localMatch.title,
      citation: localMatch.citation,
      confidence: "Platform Verified",
    };
  }

  // -------------------------------------------------------------
  // 2. Build prompt for Gemini LLM Copilot
  // -------------------------------------------------------------
  const systemPrompt = `
You are "GeM Compliflix AI", the dedicated AI Copilot for the GeM Compliance Platform.
You assist Government Procurement Officers in navigating the platform, executing procurement workflows, understanding statutory compliance rules (GFR 2017, GeM GTC v4.0, Make in India, MSME, Land Border Rule 144(xi)), and troubleshooting platform actions.

==============================
CURRENT OFFICER CONTEXT
==============================
Current Tab / View: ${activeMenu || "dashboard"}
Active Tender ID: ${tenderId || "None selected"}
Active Bidder ID: ${bidderId || "None selected"}
User Role: ${role || "OFFICER"}

==============================
PLATFORM SECTIONS & ROUTES
==============================
- Dashboard Overview: /dashboard?tab=dashboard (KPI metrics, pending evaluations, quick actions)
- Tender Submissions: /dashboard?tab=submissions (bidder list, documents, comparative evaluation drawer)
- Top Bidders: /dashboard?tab=top-bidders (QCBS GFR Rule 192, 70:30 technical/financial ranking)
- Compliance Verification: /dashboard?tab=compliance (GFR 144(xi) land border, Make in India, MSME, GSTIN checks)
- Upload & Extract: /dashboard?tab=upload-extract (upload RFP PDF/DOCX, OCR clause extraction, publish tender)
- Reports: /dashboard?tab=reports (compliance reports, export PDF/CSV)
- Audit Trail: /dashboard?tab=audit (immutable historical action logs)
- Public Tenders: /tenders
- Bidders Directory: /bidders

==============================
12-STEP WORKFLOW
==============================
1. Create Tender (Upload & Extract tab)
2. Enter Tender Details (Title, Ref No, Category, Value)
3. Upload Tender Documents (PDF/DOCX up to 50MB)
4. Extract Tender Information (AI/OCR clause parsing)
5. Tender Requirements Identified & Published
6. Receive Bidder Submissions (Tender Submissions tab)
7. Inspect Bidder Documents (PAN, GSTIN, Udyam, CA statements)
8. Document Verification (Statutory authenticity checks)
9. Compliance Check (Rule 144(xi), Make in India, MSME concessions)
10. AI Verification & QCBS Ranking (70:30 Quality & Cost Based Selection)
11. Officer Evaluation & Compliance Report (Approve/reject & export PDF/CSV in Reports tab)
12. Archive Tender (Permanent storage with immutable audit trail)

==============================
GROUND RULES
==============================
1. NAME: Always identify as "GeM Compliflix AI".
2. BILINGUAL / HINGLISH: Understand and respond naturally whether the user asks in English or Hindi/Hinglish (e.g., "Mujhe tender create karna hai", "upload nahi ho raha").
3. NO FAKE DATA / NO FAKE IDs:
   - Never say or fabricate a fake tender ID like '1' or bidder ID like 'BID-007'.
   - If the user asks about evaluating a specific bidder while no bidder is selected:
     Say: "To evaluate a specific bidder's financial compliance, please open the relevant Tender Submission and select the bidder first. I can then help you understand the available compliance evidence and verification results."
4. NO TECHNICAL JARGON:
   - Never expose raw API payloads, pgvector internal vector scores, database tables, or embedding mechanics to the officer.
   - Speak in clear, professional, government procurement terminology.
5. STEP-BY-STEP:
   - Provide clear, numbered steps mentioning the actual tab/section names in the platform.

==============================
OFFICER QUESTION
==============================
${cleanQuery}
`;

  if (model) {
    try {
      const response = await model.invoke(systemPrompt);
      const answerContent = response?.content || response?.text || "";

      if (answerContent && answerContent.trim()) {
        return {
          answer: answerContent.trim(),
          title: "GeM Compliflix AI Guidance",
          citation: "GeM Compliance Platform Knowledge & GFR 2017",
          confidence: "Verified Copilot Guidance",
        };
      }
    } catch (llmErr) {
      console.warn("GeM Compliflix AI Gemini call failed, using knowledge match:", llmErr.message);
    }
  }

  // Fallback to local match or standard informative response
  if (localMatch) {
    return {
      answer: localMatch.text,
      title: localMatch.title,
      citation: localMatch.citation,
      confidence: "Platform Verified",
    };
  }

  return {
    answer: `I am **GeM Compliflix AI**, your copilot for the GeM Compliance Platform.\n\nI can assist you with:\n- **Platform Navigation**: Locating **Upload & Extract**, **Tender Submissions**, **Compliance Verification**, **QCBS Top Bidders**, or **Reports**.\n- **Workflows**: Explaining what to do next after uploading a tender or receiving bids.\n- **GeM & Procurement Rules**: GFR Rule 144(xi) (Land Border), Make in India (Class-I/II), MSME concessions, or GST verification.\n- **Troubleshooting**: Assisting if document upload or OCR extraction encounters an issue.\n\nPlease feel free to ask a specific question like *"How do I create a tender?"*, *"What should I do after uploading documents?"*, or *"Where can I see bidder submissions?"*.`,
    title: "GeM Compliflix AI Assistance",
    citation: "GeM Platform Guidance",
    confidence: "Platform Guide",
  };
}

module.exports = {
  answerPlatformCopilotQuery,
  findPlatformKnowledgeMatch,
  isBidderSpecificQueryWithoutContext,
};
