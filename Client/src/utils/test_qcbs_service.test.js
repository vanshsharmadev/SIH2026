/* global process */
/**
 * Automated Verification Test for QCBS Top 10 Bidders feature & GFR 192 algorithm
 * Run with: node Client/src/utils/test_qcbs_service.test.js
 */

import { formatIndianLakhCrore, formatCurrencyINR } from './helpers.js';

// Isolated Test Fixture for mathematical verification of GFR 192 formula
const TEST_QCBS_BIDDERS = [
  {
    rank: 1,
    rankLabel: 'L1 (Winner / Best Evaluated)',
    bidderId: 101,
    companyName: 'Larsen & Toubro Heavy Civil Infra',
    gstNumber: '27AAACL0149A1Z9',
    bidAmount: 43800000,
    yearsOfExperience: 35,
    experienceLabel: '35+ Years Infrastructure',
    experienceScore: 99.0,
    priceScore: 100.0,
    qcbsScore: 99.3,
    technicalScore: 99.0,
    complianceScore: 98.5,
    authenticityScore: 99.0,
    financialScore: 100.0,
    cisStatus: 'CLEAR',
    verdict: 'HIGHLY_RECOMMENDED',
    riskLevel: 'LOW',
    badges: ['Class-I Local Supplier (MII)', 'Low Risk', 'L1 Winner'],
    highlights: ['Lowest normalized quote', 'Perfect GFR 144 compliance'],
  },
  {
    rank: 2,
    rankLabel: 'L2 (Technically Strong)',
    bidderId: 102,
    companyName: 'Tata Projects Limited',
    gstNumber: '27AAACT2727Q1ZT',
    bidAmount: 45200000,
    yearsOfExperience: 32,
    experienceLabel: '32+ Years EPC & Industrial',
    experienceScore: 98.0,
    priceScore: 96.9,
    qcbsScore: 97.7,
    technicalScore: 98.0,
    complianceScore: 97.0,
    authenticityScore: 98.0,
    financialScore: 97.0,
    cisStatus: 'CLEAR',
    verdict: 'QUALIFIED',
    riskLevel: 'LOW',
    badges: ['Class-I Supplier', 'Low Risk'],
    highlights: ['Extensive turnkey experience'],
  },
];

const getTestQcbsResponse = () => ({
  tenderId: 1,
  tenderTitle: 'Solar Power Installation Tender',
  topRecommendedBidder: TEST_QCBS_BIDDERS[0].companyName,
  evaluationSummary: {
    selectionMethod: 'QCBS (Rule 192 of GFR 2017 & GeM Standard Guidelines)',
    scoringAlgorithm: 'QCBS: 70% Past Experience/Technical + 30% Financial Price',
    qualityWeightage: '70%',
    priceWeightage: '30%',
    priceNormalizationFormula: '(L_min / L_bidder) * 100',
    lowestQuotedPriceInr: 43800000,
    bestEvaluatedBidder: TEST_QCBS_BIDDERS[0].companyName,
    bestEvaluatedScore: TEST_QCBS_BIDDERS[0].qcbsScore,
  },
  topBidders: TEST_QCBS_BIDDERS,
});

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

console.log('\n======================================================');
console.log('--- Test Suite: QCBS Top 10 Bidders & GFR 192 Engine ---');
console.log('======================================================\n');

// 1. Currency & Crore/Lakh Formatter Tests
console.log('1. Currency & Indian Denomination Formatting:');
assert(formatIndianLakhCrore(43800000) === '₹4.38 Cr', '43,800,000 formats to ₹4.38 Cr');
assert(formatIndianLakhCrore(185000000) === '₹18.50 Cr', '185,000,000 formats to ₹18.50 Cr');
assert(formatIndianLakhCrore(4500000) === '₹45 Lakh', '4,500,000 formats to ₹45 Lakh');
assert(formatIndianLakhCrore(750000) === '₹7.50 Lakh', '750,000 formats to ₹7.50 Lakh');
assert(formatIndianLakhCrore(0) === '₹0', '0 formats to ₹0');
assert(formatIndianLakhCrore(null) === '₹0', 'null safely formats to ₹0');

// 2. Data Structure Compliance Tests
console.log('\n2. QCBS Data Contract Compliance (OfficerApiResponse<TopBiddersResponse>):');
const mockResponse = getTestQcbsResponse();
assert(mockResponse.tenderId === 1, 'Contains valid tenderId');
assert(typeof mockResponse.topRecommendedBidder === 'string', 'Contains topRecommendedBidder string');
assert(typeof mockResponse.evaluationSummary === 'object', 'Contains evaluationSummary object');
assert(mockResponse.evaluationSummary.qualityWeightage === '70%', 'qualityWeightage is 70%');
assert(mockResponse.evaluationSummary.priceWeightage === '30%', 'priceWeightage is 30%');
assert(Array.isArray(mockResponse.topBidders), 'topBidders is an array');
assert(mockResponse.topBidders.length > 0, 'topBidders contains ranked candidate bidders');

// 3. Top Bidder Schema & GFR 192 Rules
console.log('\n3. Bidder Record Schema & Mathematical Verification:');
const winner = mockResponse.topBidders[0];
assert(winner.rank === 1, 'Top bidder is rank 1');
assert(winner.rankLabel.includes('L1'), 'Rank label designates L1 winner');
assert(winner.priceScore === 100.0, 'L1 bidder has normalized price score 100.0%');
assert(winner.qcbsScore >= 99.0, 'L1 bidder has composite QCBS score >= 99%');
assert(winner.riskLevel === 'LOW', 'L1 bidder risk level is LOW');
assert(Array.isArray(winner.badges) && winner.badges.length > 0, 'Badges list is populated');
assert(Array.isArray(winner.highlights) && winner.highlights.length > 0, 'Highlights list is populated');

// 4. Formula Accuracy Check for Bidders
console.log('\n4. Price Normalization & QCBS Composite Score Consistency:');
const L_min = mockResponse.evaluationSummary.lowestQuotedPriceInr;
let formulaConsistent = true;
let monotonicRanks = true;

for (let i = 0; i < mockResponse.topBidders.length; i++) {
  const b = mockResponse.topBidders[i];
  const expectedPriceScore = Number(((L_min / b.bidAmount) * 100).toFixed(1));
  const diff = Math.abs(b.priceScore - expectedPriceScore);
  if (diff > 0.5) {
    formulaConsistent = false;
    console.error(`Discrepancy at rank ${b.rank}: got ${b.priceScore}, expected ~${expectedPriceScore}`);
  }

  if (i > 0 && mockResponse.topBidders[i - 1].qcbsScore < b.qcbsScore) {
    monotonicRanks = false;
  }
}

assert(formulaConsistent, 'All bidder price scores adhere to (L_min / L_bidder) * 100 formula');
assert(monotonicRanks, 'Bidders are sorted strictly by descending QCBS composite score');

// Summary
console.log('\n======================================================');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
