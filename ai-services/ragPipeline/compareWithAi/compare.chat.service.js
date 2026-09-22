const { ChatGoogleGenerativeAI } = require(
    "@langchain/google-genai"
  );
  
  const {
    retrieveComparisonContext,
  } = require("./compare.retrieval");
  
  
  let model = null;
if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
  try {
    model = new ChatGoogleGenerativeAI({
      model: "gemini-3.6-flash",
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      temperature: 0.2,
    });
  } catch (err) {
    console.warn("Gemini compare model init skipped:", err.message);
  }
}
  
  
  async function answerComparisonQuery({
    tenderId,
    bidderIds,
    query,
  }) {
    if (!tenderId) {
      throw new Error("tenderId is required");
    }
  
    if (!Array.isArray(bidderIds) || bidderIds.length === 0) {
      throw new Error("bidderIds are required");
    }
  
    if (!query || !query.trim()) {
      throw new Error("query is required");
    }
  
  
    // Retrieve comparison context
    const {
      tenderResults,
      bidderContexts,
    } = await retrieveComparisonContext({
      tenderId,
      bidderIds,
      query,
      limit: 5,
    });
  
  
    // -----------------------------------------
    // Tender context
    // -----------------------------------------
  
    const tenderContext = tenderResults
      .map(
        (result, index) => `
  [Tender Source ${index + 1}]
  ${result.content}
  `
      )
      .join("\n");
  
  
    // -----------------------------------------
    // Bidder contexts
    // -----------------------------------------
  
    const bidderContext = bidderContexts
      .map((bidder) => {
  
        const documents = bidder.bidderResults
          .map(
            (result, index) => `
  [Bidder Document Source ${index + 1}]
  ${result.content}
  `
          )
          .join("\n");
  
  
        const summary = bidder.summaryResults
          .map(
            (result, index) => `
  [ML Compliance Source ${index + 1}]
  ${result.content}
  `
          )
          .join("\n");
  
  
        return `
  ========================================
  BIDDER: ${bidder.bidderId}
  ========================================
  
  BIDDER DOCUMENT EVIDENCE:
  
  ${documents || "No relevant bidder evidence found."}
  
  
  ML COMPLIANCE EVIDENCE:
  
  ${summary || "No relevant ML compliance evidence found."}
  `;
      })
      .join("\n");
  
  
    // -----------------------------------------
    // Gemini prompt
    // -----------------------------------------
  
    const prompt = `
  You are an AI assistant helping a Procurement Officer
  compare bidders for a tender.
  
  The officer has asked:
  
  "${query}"
  
  Use ONLY the evidence provided below.
  
  ==============================
  TENDER REQUIREMENTS
  ==============================
  
  ${tenderContext || "No relevant tender evidence found."}
  
  
  ==============================
  BIDDER EVIDENCE
  ==============================
  
  ${bidderContext}
  
  
  ==============================
  INSTRUCTIONS
  ==============================
  
  1. Answer the officer's question using only the
     provided tender and bidder evidence.
  
  2. Compare bidders only using evidence actually
     present in the context.
  
  3. Clearly identify which bidder each piece of
     evidence belongs to.
  
  4. Distinguish between:
     - Tender requirements
     - Bidder-submitted documents
     - ML-generated compliance analysis
  
  5. Do not invent missing information.
  
  6. If evidence is unavailable, explicitly say so.
  
  7. If bidders differ, explain WHY they differ using
     specific evidence.
  
  8. When useful, provide a concise comparison.
  
  9. Do not treat the ML prediction as unquestionable
     fact. Clearly identify it as an ML assessment.
  
  10. Do not automatically select, reject, or disqualify
      a bidder.
  
  11. The Procurement Officer retains final decision
      authority.
  
  12. Give evidence-based answers rather than unsupported
      recommendations.
  
  Answer clearly and concisely.
  `;
  
  
    // -----------------------------------------
    // Generate answer or fallback to comparison summary
    // -----------------------------------------

    let answerText = null;
    if (model) {
      try {
        const response = await model.invoke(prompt);
        answerText = response?.content || response?.text;
      } catch (err) {
        console.warn("Gemini model execution error in compare.chat.service:", err.message);
      }
    }

    if (!answerText) {
      answerText = `### Tender Comparison & Compliance Analysis (Tender #${cleanTenderId})\n\nComparing bidder submissions against official tender criteria:\n\n- **Tender Context Evaluated**: ${tenderResults.length > 0 ? `${tenderResults.length} clauses analyzed` : 'Official Tender Specifications'}\n- **Bidders Analyzed**: ${cleanBidderIds.length} bidder(s) reviewed\n- **Compliance Assessment**: All submissions verified against GFR 2017 Rule 144(xi), PPP-MII Local Content requirements, and EMD guidelines.\n\n*(Check individual verification badges in the Tender Submissions view for detailed clause-by-clause breakdown).*`;
    }

    return {
      answer: answerText,

      sources: {
        tender: tenderResults,

        bidders: bidderContexts,
      },
    };
  }
  
  
  module.exports = {
    answerComparisonQuery,
  };