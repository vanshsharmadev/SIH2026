require("dotenv").config();

const {
    answerBidderQueryAboutTender,
} = require("./bidder.chatOneTender.service.js");

const TENDER_ID = "TND-TEST-001";

async function runTest(name, testFunction) {
    console.log("\n========================================");
    console.log(`TEST: ${name}`);
    console.log("========================================");

    try {
        await testFunction();
        console.log("PASS");
    } catch (error) {
        console.log("FAIL");
        console.error("Error:", error.message);
    }
}


// ========================================
// TEST 1: Valid tender query
// ========================================

async function testValidQuery() {

    const result = await answerBidderQueryAboutTender({
        tenderId: TENDER_ID,
        query: "What are the eligibility requirements for this tender?"
    });

    if (!result) {
        throw new Error("No result returned");
    }

    if (!result.answer) {
        throw new Error("AI answer is missing");
    }

    if (!result.sources) {
        throw new Error("Sources are missing");
    }

    if (!result.sources.tender) {
        throw new Error("Tender sources are missing");
    }

    console.log("\nQuestion:");
    console.log("What are the eligibility requirements for this tender?");

    console.log("\nAI Answer:");
    console.log(result.answer);

    console.log("\nRetrieved Sources:");
    console.log(result.sources.tender.length);
}


// ========================================
// TEST 2: Missing tenderId
// ========================================

async function testMissingTenderId() {

    try {

        await answerBidderQueryAboutTender({
            query: "What are the eligibility requirements?"
        });

        throw new Error(
            "Expected tenderId validation error"
        );

    } catch (error) {

        if (error.message !== "tenderId is required") {
            throw error;
        }

        console.log("Correctly rejected missing tenderId");
    }
}


// ========================================
// TEST 3: Empty query
// ========================================

async function testEmptyQuery() {

    try {

        await answerBidderQueryAboutTender({
            tenderId: TENDER_ID,
            query: ""
        });

        throw new Error(
            "Expected query validation error"
        );

    } catch (error) {

        if (error.message !== "query is required") {
            throw error;
        }

        console.log("Correctly rejected empty query");
    }
}


// ========================================
// TEST 4: Whitespace query
// ========================================

async function testWhitespaceQuery() {

    try {

        await answerBidderQueryAboutTender({
            tenderId: TENDER_ID,
            query: "     "
        });

        throw new Error(
            "Expected query validation error"
        );

    } catch (error) {

        if (error.message !== "query is required") {
            throw error;
        }

        console.log("Correctly rejected whitespace query");
    }
}


// ========================================
// TEST 5: Document-related question
// ========================================

async function testRequiredDocuments() {

    const result = await answerBidderQueryAboutTender({
        tenderId: TENDER_ID,
        query: "What documents are required to submit the bid?"
    });

    if (!result.answer) {
        throw new Error("No AI answer returned");
    }

    console.log("\nQuestion:");
    console.log("What documents are required to submit the bid?");

    console.log("\nAI Answer:");
    console.log(result.answer);

    console.log("\nSources retrieved:",
        result.sources.tender.length
    );
}


// ========================================
// TEST 6: Financial requirement
// ========================================

async function testFinancialRequirement() {

    const result = await answerBidderQueryAboutTender({
        tenderId: TENDER_ID,
        query: "What is the minimum financial or turnover requirement?"
    });

    if (!result.answer) {
        throw new Error("No AI answer returned");
    }

    console.log("\nQuestion:");
    console.log("What is the minimum financial or turnover requirement?");

    console.log("\nAI Answer:");
    console.log(result.answer);

    console.log("\nSources retrieved:",
        result.sources.tender.length
    );
}


// ========================================
// TEST 7: Out-of-context question
// ========================================

async function testOutOfContextQuestion() {

    const result = await answerBidderQueryAboutTender({
        tenderId: TENDER_ID,
        query: "What is the current price of gold in India?"
    });

    if (!result.answer) {
        throw new Error("No AI answer returned");
    }

    console.log("\nQuestion:");
    console.log("What is the current price of gold in India?");

    console.log("\nAI Answer:");
    console.log(result.answer);

    console.log(
        "\nExpected: The model should indicate that the tender context does not contain this information."
    );
}


// ========================================
// RUN TESTS
// ========================================

async function main() {

    await runTest(
        "Valid Tender Query",
        testValidQuery
    );

    await runTest(
        "Missing Tender ID",
        testMissingTenderId
    );

    await runTest(
        "Empty Query",
        testEmptyQuery
    );

    await runTest(
        "Whitespace Query",
        testWhitespaceQuery
    );

    await runTest(
        "Required Documents",
        testRequiredDocuments
    );

    await runTest(
        "Financial Requirement",
        testFinancialRequirement
    );

    await runTest(
        "Out-of-Context Question",
        testOutOfContextQuestion
    );

    console.log("\n========================================");
    console.log("ALL TESTS COMPLETED");
    console.log("========================================");
}

main();