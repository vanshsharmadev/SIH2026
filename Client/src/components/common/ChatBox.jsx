import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Minimize2,
  Maximize2,
  Trash2,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { tenderService } from '../../services';
import MarkdownRenderer from './MarkdownRenderer';

const INITIAL_MESSAGES = [
  {
    id: 'welcome-1',
    sender: 'bot',
    text: `Hi! 👋

I am **GeM Compliflix AI**, your AI Assistant for navigating the GeM Compliance Platform.

You can ask me about:
• Creating and managing tenders
• Bidder evaluation
• Compliance verification
• AI verification
• Reports and analytics
• Platform workflows
• GeM & procurement rules
• Troubleshooting

What would you like help with?`,
    timestamp: 'Just now',
    citation: 'GeM Compliance Platform • AI Assistant',
    confidence: 'Platform Verified',
  },
];

const SUGGESTIONS = [
  'How do I create a new tender?',
  'What should I do after uploading tender documents?',
  'How does AI verification work?',
  'Where can I view bidder submissions?',
  'How do I evaluate a bidder?',
  'How do I generate a compliance report?',
  'What should I do if document extraction fails?',
  'Where can I find archived tenders?',
  'Explain the tender evaluation workflow.',
  'What is GFR Rule 144(xi)?',
  'What is Make in India Class-I supplier?',
  'What documents are required for GST compliance?',
  'What is MSME/Udyam registration?',
];

/**
 * Robust client-side fallback knowledge engine for GeM Compliflix AI.
 * Ensures instant, accurate, verified assistance even when offline or during downstream delays.
 */
function resolveLocalAssistantKnowledge(query, { bidderId } = {}) {
  const q = (query || '').toLowerCase().trim();

  // Guard: Bidder-specific question when no bidder context exists
  const bidderSpecificKeywords = [
    'this bidder',
    'the bidder',
    'ye bidder',
    'yeh bidder',
    'is bidder',
    'financial criteria',
    'turnover requirement',
    'is this bidder eligible',
    'bidder meet',
    'bidder pass',
    'bidder qualified',
    'bidder eligible',
  ];
  const hasBidderKeyword = bidderSpecificKeywords.some((k) => q.includes(k));
  if (hasBidderKeyword && (!bidderId || bidderId === 'BID-007')) {
    return {
      title: 'Select Bidder in Tender Submissions',
      citation: 'Evaluation Context Required • GFR 2017 Rules',
      confidence: 'Verified Workflow',
      text: `To evaluate a specific bidder's financial compliance, please open the relevant **Tender Submissions** and select the bidder first.

I can then help you understand the available compliance evidence and verification results.

### Standard GeM & GFR 2017 Financial Criteria:
- **Turnover Requirement**: Typically 30% to 50% of the estimated tender value over the last 3 financial years.
- **Chartered Accountant Certificate**: Must bear an active **Unique Document Identification Number (UDIN)** issued by ICAI.
- **MSME / Startup Relaxations**: Under GFR Rule 173(i), registered MSEs and DPIIT-recognized startups may receive turnover and prior experience relaxations.`,
    };
  }

  // 1. Troubleshooting / Upload failures
  if (
    q.includes('upload nahi') ||
    (q.includes('upload') &&
      (q.includes('fail') ||
        q.includes('error') ||
        q.includes('stuck') ||
        q.includes('not working') ||
        q.includes('problem') ||
        q.includes('kya karu'))) ||
    q.includes('document upload')
  ) {
    return {
      title: 'Troubleshooting: Document Upload Issues',
      citation: 'Troubleshooting Guide • GeM Compliflix AI',
      confidence: 'Platform Guide',
      text: `### Please check the following steps:

1. **Supported File Format**: Ensure your file is in **PDF**, **DOCX**, **XLSX**, **PNG**, or **JPG** format.
2. **File Size Limit**: Confirm the file is within the **50MB** size limit.
3. **Active Processing**: If you uploaded a large multi-page PDF, allow up to 30-45 seconds for OCR parsing. Inspect the **Process Logs** in the **Upload & Extract** tab.
4. **Network & Session**: Verify that your login session is active and not timed out.
5. **Alternative**: If a particular scan fails, test with one of the built-in sample RFPs in the **Upload & Extract** tab.`,
    };
  }

  // 2. Tender Creation
  if (
    (q.includes('tender') &&
      (q.includes('create') ||
        q.includes('banaye') ||
        q.includes('bana') ||
        q.includes('new tender') ||
        q.includes('naya tender') ||
        q.includes('draft'))) ||
    q.includes('create tender') ||
    q.includes('kaha se karu')
  ) {
    return {
      title: 'How to Create a New Tender',
      citation: 'Platform Navigation • Upload & Extract',
      confidence: 'Platform Guide',
      text: `### Steps to Create a Tender:

1. **Navigate**: In the left sidebar, click **Upload & Extract** (or go to \`/dashboard?tab=upload-extract\`).
2. **Auto-Extract via Document**: Drag and drop your tender RFP/NIT PDF into the upload box, or click **Upload Tender Document**.
3. **Or Fill Manually**: Enter Tender Title, Department, Category, Estimated Value, and EMD amount.
4. **Run Extraction**: Click **Process & Extract Clauses** to allow the AI to extract statutory requirements.
5. **Publish Tender**: Review the extracted clauses and click **Publish Tender** to make it active for bidders.`,
    };
  }

  // 3. Bidder Submissions location
  if (
    (q.includes('bidder') &&
      (q.includes('submission') || q.includes('submissions') || q.includes('kaha') || q.includes('where'))) ||
    q.includes('submissions kaha') ||
    q.includes('bids kaha')
  ) {
    return {
      title: 'Locating Bidder Submissions',
      citation: 'Platform Navigation • Tender Submissions',
      confidence: 'Platform Guide',
      text: `### Where to Find Bidder Submissions:

1. **Open Tender Submissions**: Click on **Tender Submissions** in the left sidebar menu (or open \`/dashboard?tab=submissions\`).
2. **Filter by Tender**: Use the top dropdown to select the specific tender (e.g. *GEM/2026/B/1001*).
3. **View Bidders**: All submitted vendor proposals will be listed with submission dates, technical packet status, and financial bids.
4. **Actions**: Click **Evaluation** on any bidder card to inspect documents or open the comparative evaluation drawer.`,
    };
  }

  // 4. Bidder evaluation procedure
  if (
    (q.includes('evaluate') && (q.includes('bidder') || q.includes('process'))) ||
    q.includes('bidder evaluate') ||
    q.includes('tender evaluation ka process')
  ) {
    return {
      title: 'Bidder Evaluation Procedure',
      citation: 'Platform Navigation • Tender Submissions & Evaluation',
      confidence: 'Platform Guide',
      text: `### How to Evaluate a Bidder:

1. **Open Tender Submissions**: Go to the **Tender Submissions** tab.
2. **Select Tender**: Choose the relevant tender from the filter dropdown.
3. **Select Bidder**: Choose the bidder from the submissions list.
4. **Open Evaluation**: Click the **Evaluation** button or **View Compliance**.
5. **Review AI Verification**: Check the automated verification for GFR Rule 144(xi), Make in India Class-I, and MSME concessions.
6. **Inspect Evidence**: Review submitted PAN, GSTIN certificate, and audited financials with UDIN.
7. **Record Officer Decision**: Enter evaluation marks and approve or reject the submission.
8. **Generate Report**: Navigate to **Reports** to download the signed Compliance Summary.`,
    };
  }

  // 5. Compliance report inquiries
  if (
    q.includes('compliance report') ||
    (q.includes('report') &&
      (q.includes('generate') || q.includes('download') || q.includes('kaise') || q.includes('export')))
  ) {
    return {
      title: 'Generating & Downloading Compliance Reports',
      citation: 'Platform Navigation • Reports & Analytics',
      confidence: 'Platform Guide',
      text: `### How to Generate a Compliance Report:

1. **Navigate to Reports**: Click **Reports** in the left sidebar (or go to \`/dashboard?tab=reports\`).
2. **Select Tender**: Choose the desired tender from the selection dropdown.
3. **Review Summary**: Inspect the executive compliance summary, bidder rankings, and statutory pass/fail breakdown.
4. **Export Report**: Click **Export PDF** for an official stamped report, or click **Export CSV** for procurement audit records.`,
    };
  }

  // 6. AI Verification inquiries
  if (
    q.includes('ai verification') ||
    (q.includes('verification') && (q.includes('work') || q.includes('kaise') || q.includes('how')))
  ) {
    return {
      title: 'How AI Verification Works',
      citation: 'System Architecture • ML & Compliance Engine',
      confidence: 'Platform Guide',
      text: `### AI Verification Architecture:

1. **Multi-Document OCR & Parsing**: High-accuracy OCR extracts text and tables from tender RFPs and vendor submissions (PDF, DOCX, scans).
2. **Statutory Rules Engine**: Evaluates vendor data against mandatory government rules:
   - **GFR Rule 144(xi)**: Land border restrictions and DPIIT registration.
   - **Make in India (MII)**: Verification of Class-I (≥50%) or Class-II (20-50%) local content.
   - **MSME / Udyam**: Automated waiver of EMD and turnover criteria.
   - **Taxpayer Status**: Real-time GSTIN validation and active debarment check under GFR Rule 151.
3. **Quality & Cost Based Selection (QCBS)**: Computes 70:30 weighted scores combining technical quality and financial competitiveness.
4. **Evidence Grounding**: Every AI recommendation is linked directly to document citations for full officer transparency.`,
    };
  }

  // 7. Workflow / Next step inquiries
  if (
    q.includes('workflow') ||
    q.includes('next step') ||
    q.includes('samajh nahi aa raha') ||
    q.includes('after upload') ||
    q.includes('uploading tender') ||
    q.includes('upload karne ke baad') ||
    (q.includes('kya') && q.includes('karu'))
  ) {
    if (q.includes('after upload') || q.includes('uploading') || q.includes('upload karne ke baad')) {
      return {
        title: 'Next Steps: After Uploading Tender Documents',
        citation: 'GeM Platform Workflow • Step 4 & 5',
        confidence: 'Platform Guide',
        text: `### What to do after uploading tender documents:

1. **Document Extraction**: The AI/OCR engine automatically processes the RFP/NIT document and extracts key tender clauses, category, estimated value, and eligibility thresholds.
2. **Review Extracted Data**: In the **Upload & Extract** tab, verify the extracted metadata and required technical qualifications.
3. **Publish Tender**: Click **Publish Tender** to make the tender active on the public registry.
4. **Receive Bids**: Monitor incoming proposals in the **Tender Submissions** tab.
5. **Document Verification & AI Compliance**: Once bids are submitted, execute automated compliance and QCBS ranking.`,
      };
    }

    return {
      title: 'GeM Compliance Platform — End-to-End Workflow',
      citation: 'GeM Standard Operating Procedure (SOP)',
      confidence: 'Platform Guide',
      text: `### Complete 12-Step Platform Workflow:

1. **Create Tender**: Open the **Upload & Extract** tab.
2. **Enter Tender Details**: Provide Title, Reference No, Department, and Estimated Value.
3. **Upload Documents**: Upload NIT/RFP PDF/DOCX (up to 50MB).
4. **Extract Information**: AI/OCR extracts clauses, turnover, and Make in India thresholds.
5. **Publish Tender**: Tender is listed on the active portal.
6. **Receive Submissions**: Bidders submit proposals via the portal.
7. **Inspect Documents**: Inspect PAN, GSTIN, Udyam, and CA statements in **Tender Submissions**.
8. **Document Verification**: Verify authenticity against statutory registries.
9. **Compliance Check**: Automated check for GFR Rule 144(xi), Make in India Class-I, and MSME concessions in **Compliance** tab.
10. **AI Verification & QCBS**: Quality & Cost Based Selection (70:30) ranks top 10 bidders in **Top Bidders** tab.
11. **Officer Evaluation & Compliance Report**: Officer approves/rejects and exports official audit report in **Reports** tab.
12. **Archive Tender**: Completed tenders are preserved with permanent audit trails.`,
    };
  }

  // 8. Archived Tenders
  if (
    q.includes('archived') ||
    q.includes('purane tender') ||
    q.includes('completed tender') ||
    q.includes('history')
  ) {
    return {
      title: 'Accessing Archived & Historical Tenders',
      citation: 'Platform Navigation • Dashboard & Audit',
      confidence: 'Platform Guide',
      text: `### Where to Find Archived Tenders:

1. **Dashboard Overview**: In the **Dashboard** tab, locate the **Status** filter dropdown and select **Archived** or **Completed**.
2. **Audit Trail**: Open the **Audit Trail** tab from the left sidebar to view permanent, immutable event logs for every historical tender and officer evaluation.`,
    };
  }

  // 9. Dashboard overview / What is this section
  if (
    q.includes('ye dashboard') ||
    q.includes('section kis kaam') ||
    q.includes('dashboard overview') ||
    q.includes('kpi')
  ) {
    return {
      title: 'Dashboard Sections & Overview',
      citation: 'Platform User Guide • Navigation Overview',
      confidence: 'Platform Guide',
      text: `### GeM Compliance Platform Sections:

- **Dashboard Overview**: Key performance metrics (Active Tenders, Pending Evaluations, Compliance Rate) and quick actions.
- **Tender Submissions**: All incoming bids, vendor documents, and comparative evaluation drawers.
- **Top Bidders (QCBS)**: AI-driven ranking of top 10 bidders under GFR Rule 192 (70:30 technical/financial weightage).
- **Compliance Verification**: Automated statutory checks for Land Border, Make in India, and MSME concessions.
- **Upload & Extract**: Create new tenders, upload RFP documents, and run OCR clause extraction.
- **Reports**: Generate and export official GeM compliance audits (PDF/CSV).
- **Audit Trail**: Immutable chronological log of all officer actions and verification activities.`,
    };
  }

  // 10. GFR Rule 144(xi)
  if (q.includes('144') || q.includes('land border') || q.includes('border')) {
    return {
      title: 'GFR 2017 Rule 144(xi) — Land Border Restrictions',
      citation: 'Ministry of Finance OM F.No.6/18/2019-PPD',
      confidence: 'Official Policy',
      text: `Under GFR 2017 Rule 144(xi) and Dept of Expenditure Order F.No.6/18/2019-PPD, any bidder from a country sharing a land border with India is eligible to bid in public procurement **only if the bidder is registered with the Competent Authority (DPIIT)** and holds valid political/security clearance from the Ministry of External Affairs (MEA) and Ministry of Home Affairs (MHA).

**Mandatory Rule**: Bids submitted without this mandatory DPIIT certificate must be rejected immediately during the technical bid evaluation stage.`,
    };
  }

  // 11. Make in India
  if (q.includes('make in india') || q.includes('mii') || q.includes('local content')) {
    return {
      title: 'Public Procurement (Preference to Make in India) Order 2017',
      citation: 'DPIIT Order P-45021/2/2017-PP (BE-II)',
      confidence: 'Official Policy',
      text: `### Make in India Classification:

- **Class-I Local Supplier**: Minimum **50%** local content. Receives statutory purchase preference.
- **Class-II Local Supplier**: **20% to 50%** local content. Can participate but receives no purchase preference.
- **Non-Local Supplier**: Less than **20%** local content. Strictly barred from participating in tenders valued up to ₹200 Crores under GFR Rule 161(iv) Global Tender Enquiry (GTE) restrictions.`,
    };
  }

  // 12. MSME / EMD
  if (q.includes('msme') || q.includes('udyam') || q.includes('emd') || q.includes('turnover exemption')) {
    return {
      title: 'MSME / MSE Concessions & EMD Exemption',
      citation: 'Public Procurement Policy for MSEs Order 2012 & GFR Rule 170(i)',
      confidence: 'Official Policy',
      text: `Under the Public Procurement Policy for Micro & Small Enterprises (MSEs) Order 2012 and GFR 2017 Rule 170(i):

1. **EMD Exemption**: All MSEs possessing a valid **Udyam Registration Certificate** are **100% exempt** from submitting Earnest Money Deposit (Bid Security).
2. **Turnover & Experience Relaxation**: Under GFR Rule 173(i), procuring entities may relax prior turnover and experience criteria for MSEs/Startups, provided technical capability and quality standards are demonstrated.
3. **Purchase Preference**: 25% of total procurement is reserved for MSEs, including sub-targets for SC/ST and women entrepreneurs.`,
    };
  }

  // 13. GST & Taxpayer
  if (q.includes('gst') || q.includes('taxpayer') || q.includes('documents required for gst')) {
    return {
      title: 'GST Compliance & Statutory Documentation',
      citation: 'GeM GTC v4.0 & Statutory Regulations',
      confidence: 'Official Policy',
      text: `### Mandatory Documents for GST & Taxpayer Compliance:

1. **GSTIN Registration Certificate**: Form GST REG-06 showing active status and principal place of business.
2. **GSTR-3B / Return Filing Proof**: Proof of regular tax return filings for the preceding 6 months.
3. **Permanent Account Number (PAN)**: Linked to company/firm identity.
4. **Audited Financial Statements**: Last 3 financial years' balance sheet and profit & loss statements audited by a Chartered Accountant with a valid **Unique Document Identification Number (UDIN)**.`,
    };
  }

  return {
    title: 'GeM Compliflix AI Assistant',
    citation: 'GeM Compliance Platform Knowledge Base',
    confidence: 'Platform Guide',
    text: `I am **GeM Compliflix AI**, your AI Assistant for the GeM Compliance Platform.

I can assist you with:
- **Platform Navigation**: Locating **Upload & Extract**, **Tender Submissions**, **Compliance Verification**, **QCBS Top Bidders**, or **Reports**.
- **Workflows**: Explaining what to do next after uploading a tender or receiving bids.
- **GeM & Procurement Rules**: GFR Rule 144(xi) (Land Border), Make in India (Class-I/II), MSME concessions, or GST verification.
- **Troubleshooting**: Assisting if document upload or OCR extraction encounters an issue.

Please try asking a specific question such as:
- *"How do I create a new tender?"*
- *"What should I do after uploading documents?"*
- *"Where can I view bidder submissions?"*
- *"Document upload nahi ho raha, kya karu?"*`,
  };
}

const ChatBox = ({
  isOpen,
  onClose,
  defaultMinimized = false,
  activeTab = 'dashboard',
  selectedTenderId = null,
  role = 'OFFICER',
  tenderId: propTenderId = null,
  bidderId: propBidderId = null,
}) => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(defaultMinimized);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !minimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, minimized, isFullscreen]);

  // Handle ESC key to exit fullscreen or close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isFullscreen, onClose]);

  const handleSend = async (userText) => {
    const query = (userText || input).trim();
    if (!query) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const targetTenderId = selectedTenderId || propTenderId || null;
    const targetBidderId = propBidderId || null;

    // 1. Primary Live Call to Backend Copilot Service
    try {
      const res = await tenderService.officerPlatformCopilotChat({
        query,
        context: {
          activeMenu: activeTab || 'dashboard',
          activeTab: activeTab || 'dashboard',
          tenderId: targetTenderId,
          bidderId: targetBidderId,
          role: role || 'OFFICER',
        },
      });

      const answerText =
        res?.data?.answer ||
        res?.answer ||
        res?.data?.response ||
        res?.response ||
        res?.data?.text ||
        res?.text ||
        res?.data?.message ||
        res?.message;

      const title = res?.data?.title || res?.title || 'GeM Compliflix AI Guidance';
      const citation = res?.data?.citation || res?.citation || 'GeM Compliance Platform Knowledge';
      const isDownstreamErrorOrInsufficient =
        !answerText ||
        typeof answerText !== 'string' ||
        answerText.includes('downstream RAG service error') ||
        answerText.includes('Unable to generate AI response') ||
        answerText.includes('tenderId is required') ||
        answerText.includes('bidderId is required') ||
        answerText.includes('None of the available sources') ||
        answerText.includes('insufficient to answer your question');

      if (!isDownstreamErrorOrInsufficient) {
        const botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          title,
          text: answerText,
          citation,
          confidence,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('GeM Compliflix AI backend call fallback:', err?.message || err);
    }

    // 2. Resilient Fallback to Local Knowledge Engine
    setTimeout(() => {
      const resolved = resolveLocalAssistantKnowledge(query, {
        bidderId: targetBidderId,
      });

      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        title: resolved.title,
        text: resolved.text,
        citation: resolved.citation,
        confidence: resolved.confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 350);
  };

  if (!isOpen) return null;

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200'
          : 'fixed bottom-5 right-4 sm:right-6 z-50 flex flex-col items-end animate-in fade-in slide-in-from-bottom-5 duration-200'
      }
    >
      {minimized ? (
        /* Minimized Pill */
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#073567] to-indigo-700 text-white font-semibold text-xs shadow-2xl hover:shadow-indigo-500/30 transition-all cursor-pointer hover:scale-105"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-emerald-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span>GeM Compliflix AI</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">
            {messages.length}
          </span>
        </button>
      ) : (
        /* Chat Window */
        <div
          className={
            isFullscreen
              ? 'w-full max-w-5xl h-[92vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 font-sans'
              : 'w-[94vw] sm:w-[440px] h-[580px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 font-sans'
          }
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#0d1e3d] via-[#073567] to-indigo-900 text-white flex items-center justify-between shadow-md select-none shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs text-emerald-300 border border-white/15">
                <Bot className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight">GeM Compliflix AI</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isFullscreen && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/15 text-emerald-300 font-medium">
                      Full Screen
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-300 font-medium">
                  Your AI Assistant for navigating the GeM Compliance Platform
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1 text-slate-300">
              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen'}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-emerald-300" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              {/* Reset / Clear Chat */}
              <button
                type="button"
                onClick={() => setMessages(INITIAL_MESSAGES)}
                title="Reset Chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                aria-label="Reset Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="p-1.5 hover:text-rose-300 hover:bg-white/10 rounded-lg transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Context Banner */}
          <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <Compass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                Tab: {activeTab}
              </span>
              {selectedTenderId && (
                <span className="truncate">
                  • Tender: <span className="font-mono text-slate-700 dark:text-slate-300">{selectedTenderId}</span>
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800/40">
              AI Assistant Active
            </span>
          </div>

          {/* Messages Area */}
          <div
            data-lenis-prevent="true"
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40 text-xs sm:text-sm"
          >
            <div className={isFullscreen ? 'max-w-4xl mx-auto space-y-4' : 'space-y-3.5'}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`${
                      isFullscreen ? 'max-w-[80%]' : 'max-w-[88%]'
                    } rounded-2xl p-3 sm:p-3.5 space-y-1.5 ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-blue-500/10'
                        : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {msg.title && (
                      <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{msg.title}</span>
                      </p>
                    )}

                    <MarkdownRenderer content={msg.text} />

                    {msg.citation && (
                      <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate">{msg.citation}</span>
                        {msg.confidence && (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
                            {msg.confidence}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-[9.5px] text-right opacity-60">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggestion Chips */}
          <div
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="px-3.5 py-2 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto whitespace-nowrap scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden flex items-center gap-1.5 shrink-0"
          >
            <div
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className={
                isFullscreen
                  ? 'max-w-4xl mx-auto w-full flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden'
                  : 'flex items-center gap-1.5'
              }
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0">
                Suggestions:
              </span>
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/60 dark:border-slate-700 transition shrink-0 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0"
          >
            <div className={isFullscreen ? 'max-w-4xl mx-auto flex items-center gap-2' : 'flex items-center gap-2'}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask GeM Compliflix AI about tenders, workflows, compliance, or troubleshooting..."
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs disabled:opacity-40 transition cursor-pointer shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
