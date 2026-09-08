const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

const {
  retrieveBidderTenderContext,
} = require("../oneBidderOneTendor/bidderTender.retrieval");

const model = new ChatGoogleGenerativeAI({
  model: "gemini-3.6-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.2,
});

async function answerBidderTenderQuery({
  tenderId,
  bidderId,
  query,
}) {
  if (!tenderId) {
    throw new Error("tenderId is required");
  }

  if (!bidderId) {
    throw new Error("bidderId is required");
  }

  if (!query || !query.trim()) {
    throw new Error("query is required");
  }

  // --------------------------------
  // Retrieve context from all 3 sources
  // --------------------------------

  const {
    tenderResults,
    bidderResults,
    summaryResults,
  } = await retrieveBidderTenderContext(
    tenderId,
    bidderId,
    query,
    5
  );

  // --------------------------------
  // Prepare tender context
  // --------------------------------

  const tenderContext = tenderResults
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

  const bidderContext = bidderResults
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

  const summaryContext = summaryResults
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
You are an AI assistant helping a procurement officer
analyze a bidder's compliance for a specific tender.

CURRENT TENDER ID:
${tenderId}

CURRENT BIDDER ID:
${bidderId}

You have access to three types of information:

1. Tender requirements
2. Bidder submitted documents
3. ML-generated compliance summary

Use these sources to answer the officer's question.

==============================
TENDER REQUIREMENTS
==============================

${tenderContext || "No relevant tender information found."}

==============================
BIDDER DOCUMENTS
==============================

${bidderContext || "No relevant bidder information found."}

==============================
ML COMPLIANCE SUMMARY
==============================

${summaryContext || "No relevant compliance summary found."}

==============================
OFFICER QUESTION
==============================

${query}

==============================
INSTRUCTIONS
==============================

- Answer only using the information provided above.
- Use the tender requirements to determine what is required.
- Use bidder documents to determine what the bidder has submitted.
- Use the ML compliance summary when it is relevant.
- Do not invent or assume missing information.
- If the available context is insufficient, clearly say so.
- Explain the answer using the available evidence.
- Do not make the final procurement decision.
- Keep the response clear and concise.
`;

  // --------------------------------
  // Call Gemini
  // --------------------------------

  const response = await model.invoke(prompt);

  return {
    answer: response.content,

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