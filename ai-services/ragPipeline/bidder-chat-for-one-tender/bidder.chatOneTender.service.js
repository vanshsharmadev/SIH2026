const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

const {
    retrieveBidderTenderContext,
} = require("./bidder.chat.retrieve.js");

const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.6-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.2,
});

async function answerBidderQueryAboutTender({
    tenderId,
    query,
}) {
    if (!tenderId) {
        throw new Error("tenderId is required");
    }


    if (!query || !query.trim()) {
        throw new Error("query is required");
    }

    // --------------------------------
    // Retrieve context from source
    // --------------------------------

    const
        tenderResults
            = await retrieveBidderTenderContext(
                tenderId,
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
    // Prompt
    // --------------------------------

    const prompt = `
You are an AI assistant helping a bidder trying to find information about a particular tender. You have access to the tender requirements and the bidder's question. Your task is to provide a clear and concise answer to the bidder's question based on the available information. If the information is insufficient, clearly state that you cannot provide a definitive answer.

CURRENT TENDER ID:
${tenderId}

You have access to the following information:

1. Tender requirements

Use this source to answer the bidder's question.

==============================
TENDER REQUIREMENTS
==============================

${tenderContext || "No relevant tender information found."}

==============================
BIDDER'S QUESTION
==============================

${query}

==============================
INSTRUCTIONS
==============================

- Answer only using the information provided above.
- Use the tender requirements to determine what is required.
- Do not invent or assume missing information.
- If the available context is insufficient, clearly say so.
- Explain the answer using the available evidence.
- Keep the response clear and concise.
`;

    // --------------------------------
    // Call Gemini
    // --------------------------------

    const response = await model.invoke(prompt);

    return {
        answer: response.content,

        sources: {
            tender: tenderResults
        },
    };
}

module.exports = {
    answerBidderQueryAboutTender,
};