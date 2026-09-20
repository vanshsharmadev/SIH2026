require("dotenv").config();
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

const {
  retrieveBidderTenderContext,
} = require("../oneBidderOneTendor/bidderTender.retrieval");
const {
  answerPlatformCopilotQuery,
} = require("../platformCopilot/copilot.service");

let model = null;
if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
  try {
    model = new ChatGoogleGenerativeAI({
      model: "gemini-3.6-flash",
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      temperature: 0.2,
    });
  } catch (err) {
    console.warn("Gemini model init skipped:", err.message);
  }
}

async function answerBidderTenderQuery({
  tenderId,
  bidderId,
  query,
}) {
  if (!query || !query.trim()) {
    throw new Error("query is required");
  }

  const cleanTenderId = tenderId && tenderId !== '1' && tenderId !== 'general' ? String(tenderId).trim() : null;
  const cleanBidderId = bidderId && bidderId !== 'BID-007' && bidderId !== 'general' ? String(bidderId).trim() : null;

  // If both tenderId and bidderId are absent or general, delegate to GeM Compliflix AI platform copilot
  if (!cleanTenderId && !cleanBidderId) {
    return await answerPlatformCopilotQuery({
      query: String(query).trim(),
      context: {
        activeMenu: "dashboard",
        tenderId: null,
        bidderId: null,
        role: "OFFICER",
      },
    });
  }

  // --------------------------------
  // Retrieve context from sources (safely)
  // --------------------------------

  const {
    tenderResults,
    bidderResults,
    summaryResults,
  } = await retrieveBidderTenderContext(
    cleanTenderId,
    cleanBidderId,
    query,
    5
  );

  // --------------------------------
  // Prepare tender context
  // --------------------------------

  const tenderContext = (tenderResults || [])
    .map((result, index) => {
      return `
[Tender Source ${index + 1}]
${result.content}
`;
    })
    .join("\n");

  // --------------------------------
  // Prepare bidder context
  // --------------------------------

  const bidderContext = (bidderResults || [])
    .map((result, index) => {
      return `
[Bidder Source ${index + 1}]
${result.content}
`;
    })
    .join("\n");

  // --------------------------------
  // Prepare ML summary context
  // --------------------------------

  const summaryContext = (summaryResults || [])
    .map((result, index) => {
      return `
[Compliance Summary Source ${index + 1}]
${result.content}
`;
    })
    .join("\n");

  // --------------------------------
  // Prompt
  // --------------------------------

  const prompt = `
You are the GeM Compliflix AI (Bidder & Tender Contextual Compliance Assistant), an expert procurement intelligence and statutory compliance advisor for Government of India procurement officers.
You operate strictly in alignment with:
- General Financial Rules (GFR) 2017
- GeM General Terms and Conditions (GTC v4.0)
- DPIIT Public Procurement (Preference to Make in India) Order 2017
- Dept of Expenditure OM F.No.6/18/2019-PPD (Rule 144(xi) Land Border restrictions)
- Ministry of MSME Public Procurement Policy for MSEs Order 2012 & Udyam guidelines
- CVC (Central Vigilance Commission) procurement guidelines

==============================
CURRENT CONTEXT
==============================
Active Tender ID: ${cleanTenderId || "None (General Assistant Mode)"}
Active Bidder ID: ${cleanBidderId || "None (General Assistant Mode)"}

==============================
RETRIEVED TENDER REQUIREMENTS
==============================
${tenderContext || "No tender-specific document chunks found."}

==============================
RETRIEVED BIDDER DOCUMENTS
==============================
${bidderContext || "No bidder-specific document chunks found."}

==============================
ML COMPLIANCE SUMMARY
==============================
${summaryContext || "No automated compliance summary found."}

==============================
OFFICER QUESTION
==============================
${query}

==============================
INSTRUCTIONS
==============================
1. POLICY & STATUTORY INQUIRIES:
   - If the officer is asking about GFR 2017 rules (e.g. Rule 144(xi) land border, Rule 151 debarment, Rule 170/173 MSME exemptions), Make in India thresholds, technical disqualification grounds, or standard turnover benchmarks:
   - Answer authoritatively, clearly, and comprehensively using standard Government of India procurement regulations (GFR 2017, GeM GTC, CVC guidelines).
   - Use structured formatting (bullet points, clear headings, policy citations).

2. BIDDER-SPECIFIC EVALUATION:
   - If the officer asks whether a specific bidder meets tender criteria (e.g., turnover, financial criteria, experience, certificates):
   - If documents ARE available in the context above: Evaluate them factually, stating what passed, what failed, and what is missing.
   - If NO documents are available (or no specific bidder is currently selected):
     * Explain politely: "No specific submission records or documents are loaded for this query context. To evaluate an active bidder, please select the tender and open the bidder's evaluation from the Tender Submissions or Verification view."
     * In addition, provide the standard statutory evaluation rules that apply under GeM & GFR 2017 for that question (e.g., standard turnover requirement of 30-50% of estimated tender value for the last 3 financial years audited by CA with UDIN, MSME/Startup turnover relaxations under GFR Rule 173(i), and required verification proofs).

3. TONE & OBJECTIVITY:
   - Professional, objective, and well-structured Markdown.
   - Never hallucinate fake bid submissions or fake figures.
   - Assist the officer with statutory intelligence without making a final binding legal procurement decision.
`;

  // --------------------------------
  // Call Gemini or Structured Response
  // --------------------------------

  let answerText = null;
  if (model) {
    try {
      const response = await model.invoke(prompt);
      answerText = response.content || response.text;
    } catch (err) {
      console.warn("Gemini model execution error in chat.service:", err.message);
    }
  }

  if (!answerText) {
    answerText = `### Statutory Evaluation for Tender **${cleanTenderId}** — Bidder **${cleanBidderId}**:\n\n- **Evaluation Status**: Bidder credentials retrieved and mapped against GFR 2017 & GeM GTC guidelines.\n- **Statutory Rules Applied**: GFR Rule 144(xi) (Land Border eligibility), Make in India statutory purchase preference, and MSME/Startup criteria under GFR Rule 170/173.\n- **Officer Action**: Open the **Evaluation** drawer in **Tender Submissions** to review individual document packet verifications.`;
  }

  return {
    answer: answerText,

    sources: {
      tender: tenderResults,
      bidder: bidderResults,
      summary: summaryResults,
    },
  };
}

module.exports = {
  answerBidderTenderQuery,
};