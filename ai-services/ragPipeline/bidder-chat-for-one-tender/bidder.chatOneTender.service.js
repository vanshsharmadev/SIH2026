const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

const {
    retrieveBidderTenderContext,
} = require("./bidder.chat.retrieve.js");

let model = null;
if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
  try {
    model = new ChatGoogleGenerativeAI({
      model: "gemini-3.6-flash",
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      temperature: 0.2,
    });
  } catch (err) {
    console.warn("Gemini bidder model init skipped:", err.message);
  }
}

async function answerBidderQueryAboutTender({
    tenderId,
    query,
    tenderContext: customTenderContext,
    sources: customSources,
}) {
    const cleanTenderId = String(tenderId ?? '').trim();
    const cleanQuery = String(query ?? '').trim();

    if (!cleanTenderId) {
        throw new Error("tenderId is required");
    }

    if (!cleanQuery) {
        throw new Error("query is required");
    }

    // --------------------------------
    // Retrieve context from vector store
    // --------------------------------

    let tenderResults = [];
    try {
        const retrieval = await retrieveBidderTenderContext(
            cleanTenderId,
            cleanQuery,
            5
        );
        tenderResults = retrieval?.tenderResults || [];
    } catch (retrievalError) {
        console.warn(
            `[RAG] Vector search failed for tenderId=${cleanTenderId} (${retrievalError.message}), checking grounded fallback.`
        );
    }

    // --------------------------------
    // Prepare tender context
    // --------------------------------

    let tenderContext = "";
    let finalSources = [];

    if (Array.isArray(tenderResults) && tenderResults.length > 0) {
        tenderContext = tenderResults
            .map((result, index) => `[Tender Source ${index + 1}]\n${result.content}\n`)
            .join("\n");
        finalSources = tenderResults.map((r, idx) => ({
            tenderId: cleanTenderId,
            document: r.metadata?.documentName || r.metadata?.documentType || `Tender_Document.pdf`,
            section: `Specification Section ${r.metadata?.chunkIndex ?? (idx + 1)}`,
            page: (r.metadata?.chunkIndex ?? idx) + 1,
            score: r.score,
        }));
    } else if (customTenderContext && typeof customTenderContext === 'string' && customTenderContext.trim()) {
        console.log(`[RAG] Grounding Gemini with provided tender context for tenderId=${cleanTenderId}`);
        tenderContext = customTenderContext.trim();
        finalSources = Array.isArray(customSources) && customSources.length > 0
            ? customSources
            : [{
                tenderId: cleanTenderId,
                document: "Tender_Specification_RFP.pdf",
                section: "Verified Tender Requirements & Criteria",
                page: 1,
            }];
    }

    // --------------------------------
    // Prompt with strict grounding
    // --------------------------------

    const prompt = `
You are an AI assistant helping a prospective bidder find information about a specific public procurement tender.
You have access to the verified tender requirements and the bidder's inquiry.
Your goal is to provide a factual, grounded, and concise answer based exclusively on the provided tender context.

CURRENT TENDER ID:
${cleanTenderId}

==============================
TENDER REQUIREMENTS
==============================

${tenderContext || "No relevant tender information found for this tender ID."}

==============================
BIDDER'S QUESTION
==============================

${cleanQuery}

==============================
INSTRUCTIONS
==============================

- Answer ONLY using the information provided in the TENDER REQUIREMENTS above.
- Do NOT invent requirements, terms, numbers, or dates.
- Do NOT infer missing eligibility criteria.
- Do NOT mention or blend information from any other tender.
- If the answer to the bidder's question is NOT present in the supplied context, clearly state: "This information is not specified in the available tender requirements."
- When stating eligibility or requirements, quote or refer to the relevant clause (e.g. GFR Rule 144(xi), PPP-MII Local Content %, EMD amount, Turnover criteria).
- Keep the response professional, clear, and concise.
`;

    // --------------------------------
    // Call Gemini or Return Grounded Context
    // --------------------------------

    let answerText = null;
    if (model) {
      try {
        const response = await model.invoke(prompt);
        answerText = response?.content || response?.text;
      } catch (err) {
        console.warn("Gemini model execution error in bidder.chatOneTender:", err.message);
      }
    }

    if (!answerText) {
      if (tenderContext && tenderContext.trim().length > 0) {
        answerText = `### Tender Requirements Summary (Tender #${cleanTenderId})\n\nBased on the published tender specifications:\n\n${tenderContext.trim().slice(0, 800)}\n\n*(Refer to the official tender document for complete clause specifications).*`;
      } else {
        answerText = `### Tender #${cleanTenderId} Specifications\n\nPlease refer to the official tender documents and GeM GTC guidelines for detailed statutory requirements.`;
      }
    }

    return {
        answer: answerText,
        sources: {
            tender: finalSources,
        },
    };
}

module.exports = {
    answerBidderQueryAboutTender,
};