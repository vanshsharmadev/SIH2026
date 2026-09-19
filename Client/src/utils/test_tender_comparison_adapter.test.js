/* global process */
/**
 * Automated Verification Script for Tender Comparison Adapter
 * Run with: node test_tender_comparison_adapter.test.js
 */

import { normalizeComparisonResponse, getBidderEvaluation } from './tenderComparisonAdapter.js';

let passed = 0;
let failed = 0;

const assert = (condition, description) => {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${description}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${description}`);
  }
};

const assertNoForbiddenStrings = (obj, path = '') => {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    if (obj.includes('undefined') || obj.includes('[object Object]')) {
      assert(false, `Forbidden string detected in "${path}": "${obj}"`);
    }
  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key === 'raw') continue; // Raw can retain original payloads for debugging
      assertNoForbiddenStrings(obj[key], `${path}.${key}`);
    }
  }
};

console.log('\n--- Test Suite: Tender Comparison Adapter ---\n');

// Test 1: 2 Bidder Response (Gemini / pgvector format)
console.log('1. Testing 2-Bidder Gemini Comparative Matrix Response:');
const gemini2BidderResponse = {
  success: true,
  tenderId: 'GEM/2024/B/5123981',
  bidderCount: 2,
  verdict: 'COMPARISON_COMPLETE',
  recommendedBidder: 'SUB/2024/000343',
  analysis: 'Evaluated candidate bidders. Verified statutory GST filings and GFR 144 compliance.',
  comparativeMatrix: [
    {
      bidderId: 'SUB/2024/000343',
      compositeScore: 94,
      technicalCompliance: 'Fully Compliant',
      financialTurnover: '₹ 14.5 Cr',
      gfr144Cleared: true,
      riskTier: 'LOW',
    },
    {
      bidderId: 'SUB/2024/000342',
      compositeScore: 88,
      technicalCompliance: 'Minor Clarification Needed',
      financialTurnover: '₹9.8 Cr',
      gfr144Cleared: true,
      riskTier: 'MEDIUM',
    },
  ],
};

const res1 = normalizeComparisonResponse(gemini2BidderResponse);
assert(res1.tenderId === 'GEM/2024/B/5123981', 'Correctly extracted tenderId');
assert(res1.bidders.length === 2, 'Parsed 2 bidders correctly');
assert(res1.verdictLabel === 'Comparison Completed', 'Transformed COMPARISON_COMPLETE -> Comparison Completed');
assert(res1.recommendedBidder?.bidderId === 'SUB/2024/000343', 'Identified recommended bidder');
assert(res1.bidders[0].compositeScore === 94, 'Composite score is 94');
assert(res1.bidders[0].scoreDisplay === '94 / 100', 'Score formatted as 94 / 100');
assert(res1.bidders[0].riskTierMeta.label === 'Low Risk', 'Risk tier formatted as Low Risk');
assert(res1.bidders[1].riskTierMeta.label === 'Medium Risk', 'Risk tier formatted as Medium Risk');
assert(res1.bidders[1].technicalComplianceMeta.icon === '⚠️', 'Warning icon for Minor Clarification Needed');
assertNoForbiddenStrings(res1);

// Test 2: 3+ Bidder Response (ML Microservice format with rankings)
console.log('\n2. Testing 3+ Bidder ML Microservice Response:');
const ml3BidderResponse = {
  success: true,
  tenderId: 'GEM/2024/B/9998881',
  biddersEvaluated: 3,
  status: 'COMPARISON_GENERATED',
  rankings: [
    {
      rank: 1,
      bidderId: 'BID-001',
      bidderName: 'Alpha Infra Ltd',
      compositeScore: 96,
      status: 'RECOMMENDED_L1',
      gfr144Compliant: true,
      pyhankoAuthentic: true,
    },
    {
      rank: 2,
      bidderId: 'BID-002',
      bidderName: 'Beta Projects LLP',
      compositeScore: 89,
      status: 'QUALIFIED',
      gfr144Compliant: true,
      pyhankoAuthentic: true,
    },
    {
      rank: 3,
      bidderId: 'BID-003',
      bidderName: 'Gamma Supplies Inc',
      compositeScore: 78,
      status: 'QUALIFIED',
      gfr144Compliant: false,
      pyhankoAuthentic: false,
    },
  ],
  aiSummary: 'Autonomous multi-bidder comparison completed for 3 bidders.',
};

const res2 = normalizeComparisonResponse(ml3BidderResponse);
assert(res2.bidders.length === 3, 'Parsed 3 bidders in ML response');
assert(res2.statusLabel === 'Comparison Generated', 'COMPARISON_GENERATED -> Comparison Generated');
assert(res2.bidders[0].isRecommended === true, 'Top ranked L1 bidder flagged as recommended');
assert(res2.bidders[2].gfr144Meta.label === 'Not Cleared', 'GFR 144 false -> Not Cleared');
assertNoForbiddenStrings(res2);

// Test 3: Missing bidderName (should fallback to bidderId)
console.log('\n3. Testing Missing bidderName Fallback:');
const missingNameResponse = {
  tenderId: 'GEM/2024/B/100',
  comparativeMatrix: [
    {
      bidderId: 'BIDDER_NO_NAME_001',
      compositeScore: 85,
    },
  ],
};
const res3 = normalizeComparisonResponse(missingNameResponse);
assert(res3.bidders[0].bidderName === 'BIDDER_NO_NAME_001', 'Missing bidderName fell back to bidderId');
assertNoForbiddenStrings(res3);

// Test 4: Missing financialTurnover, missing riskTier (should show "N/A")
console.log('\n4. Testing Missing financialTurnover and riskTier:');
const missingFieldsResponse = {
  tenderId: 'GEM/2024/B/101',
  comparativeMatrix: [
    {
      bidderId: 'BID-101',
      compositeScore: 90,
      financialTurnover: null,
      riskTier: undefined,
    },
  ],
};
const res4 = normalizeComparisonResponse(missingFieldsResponse);
assert(res4.bidders[0].financialTurnover === 'N/A', 'Missing turnover safely rendered as N/A');
assert(res4.bidders[0].riskTierMeta.label === 'N/A', 'Missing riskTier safely rendered as N/A');
assertNoForbiddenStrings(res4);

// Test 5: Missing analysis
console.log('\n5. Testing Missing Analysis:');
const missingAnalysisResponse = {
  tenderId: 'GEM/2024/B/102',
  biddersEvaluated: 1,
  comparativeMatrix: [{ bidderId: 'BID-1' }],
};
const res5 = normalizeComparisonResponse(missingAnalysisResponse);
assert(res5.analysis.hasContent === false, 'Safely noted no analysis content');
assert(res5.analysis.summary === '', 'Summary safely empty without throwing');
assertNoForbiddenStrings(res5);

// Test 6: Empty rankings / empty matrix
console.log('\n6. Testing Empty Rankings:');
const emptyResponse = {
  tenderId: 'GEM/2024/B/103',
  rankings: [],
  comparativeMatrix: [],
};
const res6 = normalizeComparisonResponse(emptyResponse);
assert(res6.isEmpty === true, 'isEmpty flagged as true');
assert(res6.bidders.length === 0, 'No bidders array produced without error');
assertNoForbiddenStrings(res6);

// Test 7: API Error / Malformed Response
console.log('\n7. Testing Malformed / Null / Error Payloads:');
const nullRes = normalizeComparisonResponse(null);
assert(nullRes.isValid === false, 'Null payload handled safely');
assert(nullRes.bidders.length === 0, 'Null payload gives 0 bidders');
assertNoForbiddenStrings(nullRes);

const undefinedRes = normalizeComparisonResponse(undefined);
assert(undefinedRes.isValid === false, 'Undefined payload handled safely');
assertNoForbiddenStrings(undefinedRes);

const randomStringRes = normalizeComparisonResponse('Server error 500');
assert(randomStringRes.isValid === false, 'String error handled safely');
assertNoForbiddenStrings(randomStringRes);

// Test 8: Combined Object { ml, ai, bidders } as in TenderSubmissionsView
console.log('\n8. Testing Combined { ml, ai, bidders } Response:');
const combinedResponse = {
  ai: gemini2BidderResponse,
  ml: {
    tenderId: 'GEM/2024/B/5123981',
    rankings: [
      {
        bidderId: 'SUB/2024/000343',
        bidderName: 'ABC Enterprises Pvt. Ltd.',
        compositeScore: 95,
        status: 'RECOMMENDED_L1',
        pyhankoAuthentic: true,
      },
      {
        bidderId: 'SUB/2024/000342',
        bidderName: 'XYZ Solutions LLP',
        compositeScore: 88,
        status: 'QUALIFIED',
        pyhankoAuthentic: true,
      },
    ],
  },
  bidders: [
    { id: 'SUB/2024/000343', bidder: 'ABC Enterprises Pvt. Ltd.', docCount: 18 },
    { id: 'SUB/2024/000342', bidder: 'XYZ Solutions LLP', docCount: 14 },
  ],
};

const res8 = normalizeComparisonResponse(combinedResponse);
assert(res8.bidders.length === 2, 'Combined 2 bidders successfully');
assert(res8.bidders[0].bidderName === 'ABC Enterprises Pvt. Ltd.', 'Bidder name merged from ML/fallback');
assert(res8.bidders[0].pyhankoAuthentic === true, 'PyHanko status merged from ML');
assert(res8.bidders[0].riskTierMeta.label === 'Low Risk', 'Risk tier merged from AI matrix');
assert(res8.complianceOverview.length >= 3, 'Generated comprehensive compliance overview');
assertNoForbiddenStrings(res8);

// Test 9: Bidder-Specific Evaluation for Drawer
console.log('\n9. Testing Bidder-Specific Extraction for AI Evaluation Drawer:');
const bidderSpecific = getBidderEvaluation(res8, 'SUB/2024/000343');
assert(bidderSpecific.bidderId === 'SUB/2024/000343', 'Extracted correct bidder ID');
assert(bidderSpecific.bidderName === 'ABC Enterprises Pvt. Ltd.', 'Extracted correct bidder name');
assert(bidderSpecific.scoreDisplay === '94 / 100', 'Score displayed as 94 / 100');
assert(bidderSpecific.technicalComplianceMeta.icon === '✅', 'Technical compliance has valid check icon');
assert(bidderSpecific.riskTierMeta.label === 'Low Risk', 'Risk tier is Low Risk');
assert(bidderSpecific.financialTurnover === '₹ 14.5 Cr', 'Turnover matches bidder matrix');
assert(bidderSpecific.gfr144Meta.label === 'Cleared', 'GFR 144 status is Cleared');
assert(bidderSpecific.complianceChecks.length >= 2, 'Compliance checks list populated');
assert(bidderSpecific.rawJson.bidderId === 'SUB/2024/000343', 'Raw JSON retained for technical accordion');
assertNoForbiddenStrings(bidderSpecific);

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL ADAPTER TESTS PASSED CLEANLY!\n');
}
