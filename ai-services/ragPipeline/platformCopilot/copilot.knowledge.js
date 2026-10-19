/**
 * GeM Compliflix AI — Platform Knowledge Base & Intelligence Engine
 * Comprehensive statutory, operational, workflow, navigation, and troubleshooting guide
 * for the GeM Compliance Platform.
 */

const PLATFORM_WORKFLOW = [
  {
    step: 1,
    name: "Create Tender",
    tab: "upload-extract",
    route: "/dashboard?tab=upload-extract",
    summary: "Initiate tender creation by providing basic metadata or uploading tender RFP document.",
    details: "Officers open the 'Upload & Extract' tab in the Dashboard. They can either fill in metadata manually or drop a tender RFP/NIT PDF document to auto-populate fields.",
    nextStep: "Enter Tender Details & Upload Tender Documents"
  },
  {
    step: 2,
    name: "Enter Tender Details",
    tab: "upload-extract",
    route: "/dashboard?tab=upload-extract",
    summary: "Provide Title, Reference Number (GEM/2026/B/XXXX), Department, Category, Estimated Value, and EMD amount.",
    details: "Crucial for compliance thresholds (e.g. tenders up to ₹200 Cr enforce Global Tender Enquiry restrictions under GFR Rule 161(iv)).",
    nextStep: "Upload Tender Documents"
  },
  {
    step: 3,
    name: "Upload Tender Documents",
    tab: "upload-extract",
    route: "/dashboard?tab=upload-extract",
    summary: "Upload official tender document (NIT, RFP, BoQ, Technical Specifications) in PDF, DOCX, or scan format.",
    details: "Supports files up to 50MB. Drag-and-drop or file selector with instant format and integrity checks.",
    nextStep: "Extract Tender Information (AI/OCR)"
  },
  {
    step: 4,
    name: "Extract Tender Information",
    tab: "upload-extract",
    route: "/dashboard?tab=upload-extract",
    summary: "AI/OCR engine parses document text, clauses, eligibility thresholds, turnover, and Make in India requirements.",
    details: "The system runs OCR and NLP chunking to parse statutory clauses, turnover requirements, EMD criteria, and required certifications automatically.",
    nextStep: "Tender Requirements Identified"
  },
  {
    step: 5,
    name: "Tender Requirements Identified & Published",
    tab: "dashboard",
    route: "/dashboard?tab=dashboard",
    summary: "Extracted requirements are confirmed and the tender is published for bidder participation.",
    details: "Tender is saved to the active registry, visible on the Public Tenders page (/tenders) and in Dashboard Overview for officer monitoring.",
    nextStep: "Receive Bidder Submissions"
  },
  {
    step: 6,
    name: "Receive Bidder Submissions",
    tab: "submissions",
    route: "/dashboard?tab=submissions",
    summary: "Vendors submit bids containing financial quotes, technical bids, and statutory credentials.",
    details: "Officers monitor incoming bids, bidder profiles, submission dates, and packet details in the 'Tender Submissions' view.",
    nextStep: "Inspect Bidder Documents"
  },
  {
    step: 7,
    name: "Inspect Bidder Documents",
    tab: "submissions",
    route: "/dashboard?tab=submissions",
    summary: "Inspect uploaded bidder credentials: PAN, GSTIN certificate, audited balance sheets, Udyam certificate, Land Border declaration.",
    details: "Officers review documents in the document drawer or download original PDFs submitted by the bidder.",
    nextStep: "Document Verification"
  },
  {
    step: 8,
    name: "Document Verification",
    tab: "compliance",
    route: "/dashboard?tab=compliance",
    summary: "Automated OCR & statutory validation of GSTIN taxpayer status, PAN validity, UDIN on CA certificates, and DPIIT clearances.",
    details: "The platform connects with statutory registries and validation algorithms to verify credentials for authenticity and expiry.",
    nextStep: "Compliance Check"
  },
  {
    step: 9,
    name: "Compliance Check",
    tab: "compliance",
    route: "/dashboard?tab=compliance",
    summary: "Rules engine checks GFR 2017 Rule 144(xi) (Land Border), Make in India Class-I (≥50%) / Class-II (20-50%), and MSME EMD exemptions.",
    details: "Calculates statutory compliance score and flags deviations (e.g. missing land border undertaking or debarment on CPPP).",
    nextStep: "AI Verification & Comparative Evaluation"
  },
  {
    step: 10,
    name: "AI Verification & QCBS Ranking",
    tab: "top-bidders",
    route: "/dashboard?tab=top-bidders",
    summary: "AI ranks bidders via Quality and Cost Based Selection (QCBS GFR Rule 192, 70:30 technical/financial weightage).",
    details: "Provides comparative scorecards, cross-bidder anomaly detection, and recommended bidder selection for the tender committee.",
    nextStep: "Officer Evaluation & Final Approval"
  },
  {
    step: 11,
    name: "Officer Evaluation & Compliance Report",
    tab: "reports",
    route: "/dashboard?tab=reports",
    summary: "Officer records final evaluation remarks, approves/rejects bids with justification, and exports audit-ready Compliance Reports.",
    details: "Export comprehensive PDF/CSV reports with statutory certificates, audit trail timestamps, and evaluation breakdown.",
    nextStep: "Archive Tender"
  },
  {
    step: 12,
    name: "Archive Tender",
    tab: "dashboard",
    route: "/dashboard?tab=dashboard",
    summary: "Completed tenders are securely archived with tamper-evident audit logs preserved permanently.",
    details: "Archived tenders remain searchable in the Dashboard filter (Status: 'Archived') and audit logs remain permanently accessible in 'Audit Trail'.",
    nextStep: "Workflow Completed"
  }
];

const PLATFORM_NAVIGATION = {
  dashboard: {
    tabName: "Dashboard Overview",
    tabKey: "dashboard",
    route: "/dashboard?tab=dashboard",
    purpose: "Central command center displaying high-level KPIs, pending evaluations, active tenders, total submissions, compliance health, and quick actions.",
    howToAccess: "Click 'Dashboard' in the left sidebar menu or navigate to /dashboard."
  },
  submissions: {
    tabName: "Tender Submissions",
    tabKey: "submissions",
    route: "/dashboard?tab=submissions",
    purpose: "Manage all bidder submissions tender-wise. View submitted documents, launch comparative evaluations, and open bidder-specific contextual evaluation.",
    howToAccess: "Click 'Tender Submissions' in the left sidebar or select the Submissions tab on the dashboard."
  },
  "top-bidders": {
    tabName: "Top Bidders (QCBS)",
    tabKey: "top-bidders",
    route: "/dashboard?tab=top-bidders",
    purpose: "Quality and Cost Based Selection (QCBS) under GFR 2017 Rule 192. Ranks top 10 bidders with 70:30 technical-to-financial weighting.",
    howToAccess: "Click 'Top Bidders' in the left sidebar or click the 'QCBS Top Bidders' quick action."
  },
  compliance: {
    tabName: "Compliance Verification",
    tabKey: "compliance",
    route: "/dashboard?tab=compliance",
    purpose: "Automated statutory compliance engine checking Land Border restrictions (Rule 144(xi)), Make in India, MSME exemptions, and GSTIN validity.",
    howToAccess: "Click 'Compliance' in the left sidebar."
  },
  "upload-extract": {
    tabName: "Upload & Extract",
    tabKey: "upload-extract",
    route: "/dashboard?tab=upload-extract",
    purpose: "Tender document upload, OCR clause extraction, tender drafting, auto-filling metadata, and publishing tenders.",
    howToAccess: "Click 'Upload & Extract' in the left sidebar or click the 'New Tender' / 'Upload RFP' button."
  },
  reports: {
    tabName: "Reports & Analytics",
    tabKey: "reports",
    route: "/dashboard?tab=reports",
    purpose: "Generate, view, and export official GeM Compliance Reports, executive summaries, and analytics in PDF or CSV format.",
    howToAccess: "Click 'Reports' in the left sidebar or navigate to /reports."
  },
  audit: {
    tabName: "Audit Trail",
    tabKey: "audit",
    route: "/dashboard?tab=audit",
    purpose: "Immutable, chronological log of all officer actions, verification events, document uploads, and evaluation outcomes for CVC/CAG transparency.",
    howToAccess: "Click 'Audit Trail' in the left sidebar or navigate to /audit."
  },
  publicTenders: {
    tabName: "Public Tenders",
    route: "/tenders",
    purpose: "Public-facing portal listing all published tenders with filtering by department, category, and value.",
    howToAccess: "Click 'Tenders' in the top navigation bar."
  },
  biddersDirectory: {
    tabName: "Bidders Directory",
    route: "/bidders",
    purpose: "Directory of registered vendors, verified supplier ratings, and registration details.",
    howToAccess: "Click 'Bidders' in the top navigation bar."
  }
};

const TROUBLESHOOTING_GUIDE = [
  {
    issue: "Document upload failed or upload button not responding",
    keywords: ["upload", "fail", "nahi ho raha", "error", "file", "stuck", "uploading"],
    resolution: [
      "Check File Format: Supported formats are PDF, DOCX, XLSX, PNG, and JPG.",
      "Check File Size: Ensure the file size is under 50MB.",
      "Check Connection: Ensure your network allows upload requests to the backend server.",
      "Inspect Processing Status: Check the 'Process Logs' in the Upload & Extract tab for detailed OCR errors.",
      "Clear & Re-select: Click 'Remove File' and re-select the document, then click 'Process & Extract'."
    ]
  },
  {
    issue: "Document extraction stuck or takes too long",
    keywords: ["extraction", "parsing", "stuck", "slow", "der ho rahi", "ocr", "extract nahi"],
    resolution: [
      "Large scanned PDFs (50+ pages) may take up to 30-45 seconds for high-resolution OCR analysis.",
      "If the extraction progress bar does not advance after 60 seconds, refresh the page and verify if the tender draft was saved in 'Past Uploads' in the Upload & Extract tab.",
      "You can also use one of the 4 quick preset RFP templates (e.g. Hardware Infrastructure RFP or Cloud Data Center NIT) to test the workflow."
    ]
  },
  {
    issue: "Cannot find bidder submissions for a tender",
    keywords: ["bidder submission", "kaha milengi", "kaha hai", "submissions", "bids"],
    resolution: [
      "Open 'Tender Submissions' from the left sidebar.",
      "Use the 'Filter by Tender' dropdown at the top to select the specific Tender ID or Title.",
      "If no submissions appear, verify whether the tender closing date has passed or whether bids have been submitted by vendors."
    ]
  },
  {
    issue: "Compliance report generation or download issues",
    keywords: ["report", "download", "export", "pdf", "generate", "csv"],
    resolution: [
      "Go to the 'Reports' tab from the left sidebar.",
      "Ensure an evaluation has been completed for at least one tender or bidder.",
      "Select your target tender from the dropdown and click 'Download PDF' or 'Export CSV'.",
      "Ensure your browser does not block pop-ups or file downloads."
    ]
  },
  {
    issue: "Where are completed or archived tenders?",
    keywords: ["archive", "archived", "old", "purane", "completed", "history"],
    resolution: [
      "Go to the Dashboard Overview (/dashboard?tab=dashboard) or Tender Submissions.",
      "In the 'Status' filter dropdown, select 'Archived' or 'Completed'.",
      "Historical evaluation scorecards and immutable audit logs can also be found anytime under the 'Audit Trail' tab."
    ]
  }
];

const STATUTORY_RULES = [
  {
    rule: "GFR 2017 Rule 144(xi)",
    title: "Land Border Restrictions (Order F.No.6/18/2019-PPD)",
    summary: "Any bidder from a country sharing a land border with India is eligible only if registered with DPIIT (Competent Authority) and possesses political/security clearances from MEA and MHA. Bids without valid registration must be rejected at the technical stage."
  },
  {
    rule: "Public Procurement (Preference to Make in India) Order 2017",
    title: "Make in India (MII) Local Content Requirements",
    summary: "Class-I Local Suppliers (≥50% local content) receive statutory purchase preference. Class-II Local Suppliers (20% to 50%) participate without purchase preference. Non-Local (<20%) are barred from tenders under ₹200 Crores (GFR Rule 161(iv) Global Tender Enquiry restriction)."
  },
  {
    rule: "MSME Public Procurement Policy for MSEs Order 2012 & GFR Rule 170/173",
    title: "MSME / Startup Concessions & EMD Exemption",
    summary: "Micro and Small Enterprises (MSEs) registered with Udyam Registration are 100% exempt from paying EMD/Bid Security. Concessions in prior turnover and experience are granted under GFR Rule 173(i) subject to meeting technical specifications."
  },
  {
    rule: "GFR 2017 Rule 151",
    title: "Debarment from Bidding (Blacklisting)",
    summary: "A bidder can be debarred for up to 2 years for corruption, fraudulent practices, or contract breach. Debarred vendors on the CPPP / GeM portal must be automatically disqualified."
  },
  {
    rule: "GFR 2017 Rule 192",
    title: "QCBS (Quality and Cost Based Selection)",
    summary: "Standard 70:30 or 80:20 evaluation method where technical quality score (70%) and financial bid score (30%) are combined to identify the highest-scoring evaluated bidder."
  },
  {
    rule: "GST & Taxpayer Compliance",
    title: "GSTIN Verification & CA Audited Accounts",
    summary: "Bidders must hold active, valid GSTIN status with regular GSTR-3B filings and 3 years audited balance sheets bearing valid Unique Document Identification Numbers (UDIN) issued by ICAI."
  }
];

module.exports = {
  PLATFORM_WORKFLOW,
  PLATFORM_NAVIGATION,
  TROUBLESHOOTING_GUIDE,
  STATUTORY_RULES
};
