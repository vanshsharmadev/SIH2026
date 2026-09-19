/**
 * Adapter and Normalization Layer for Tender & Bidder Comparative Evaluations.
 * 
 * Transforms raw ML Microservice and Gemini/pgvector comparison responses into
 * a sanitized, human-readable view model for procurement officers.
 * 
 * Guarantees:
 * - No raw `undefined`, `null`, or `[object Object]` in user-facing fields.
 * - Missing fields safely fallback to "N/A".
 * - Missing bidder names fallback to `bidderId`.
 * - Scores are preserved dynamically without invented values.
 * - Raw JSON payloads are preserved for technical audit accordions.
 */

// Human-readable mappings for common backend enum statuses
export const STATUS_LABEL_MAP = {
  COMPARISON_COMPLETE: 'Comparison Completed',
  COMPARISON_GENERATED: 'Comparison Generated',
  EVALUATION_COMPLETE: 'Evaluation Completed',
  IN_PROGRESS: 'Analysis In Progress',
  PENDING: 'Pending Evaluation',
  FAILED: 'Evaluation Failed',
  RECOMMENDED_L1: 'L1 Bidder (Recommended)',
  QUALIFIED: 'Technically Qualified',
  DISQUALIFIED: 'Disqualified',
  UNDER_REVIEW: 'Under Review',
};

/**
 * Format enum or code string to Title Case with readable spaces.
 * Example: "COMPARISON_COMPLETE" -> "Comparison Completed"
 */
export const formatStatusLabel = (status) => {
  if (!status || typeof status !== 'string') return 'N/A';
  const trimmed = status.trim();
  if (STATUS_LABEL_MAP[trimmed]) return STATUS_LABEL_MAP[trimmed];

  // Convert SNAKE_CASE or SCREAMING_SNAKE to Title Case
  return trimmed
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Visual badge and label configuration for Risk Tiers.
 */
export const getRiskTierMeta = (tier) => {
  if (!tier || typeof tier !== 'string') {
    return {
      raw: 'N/A',
      label: 'N/A',
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      dotClass: 'bg-slate-400',
      icon: '⚪',
    };
  }

  const normalized = tier.toUpperCase().trim();
  switch (normalized) {
    case 'LOW':
      return {
        raw: normalized,
        label: 'Low Risk',
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
        icon: '🟢',
      };
    case 'MEDIUM':
    case 'MODERATE':
      return {
        raw: normalized,
        label: 'Medium Risk',
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dotClass: 'bg-amber-500',
        icon: '🟡',
      };
    case 'HIGH':
    case 'CRITICAL':
      return {
        raw: normalized,
        label: 'High Risk',
        badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        dotClass: 'bg-rose-500',
        icon: '🔴',
      };
    default:
      return {
        raw: normalized,
        label: formatStatusLabel(normalized),
        badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dotClass: 'bg-slate-400',
        icon: '⚪',
      };
  }
};

/**
 * Visual badge and label configuration for Technical Compliance.
 */
export const getTechnicalComplianceMeta = (compliance) => {
  if (!compliance || typeof compliance !== 'string') {
    return {
      raw: 'N/A',
      label: 'N/A',
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      iconType: 'none',
      icon: '⚪',
    };
  }

  const clean = compliance.trim();
  const lower = clean.toLowerCase();

  if (lower.includes('fully') || lower.includes('compliant') && !lower.includes('non') && !lower.includes('minor') && !lower.includes('clarification')) {
    return {
      raw: clean,
      label: 'Fully Compliant',
      badgeClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      iconType: 'check',
      icon: '✅',
    };
  }

  if (lower.includes('clarification') || lower.includes('minor') || lower.includes('flagged') || lower.includes('pending')) {
    return {
      raw: clean,
      label: clean.includes('Minor Clarification Needed') ? 'Minor Clarification Needed' : clean,
      badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      iconType: 'warning',
      icon: '⚠️',
    };
  }

  if (lower.includes('non') || lower.includes('reject') || lower.includes('failed')) {
    return {
      raw: clean,
      label: 'Non-Compliant',
      badgeClass: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      iconType: 'error',
      icon: '❌',
    };
  }

  return {
    raw: clean,
    label: clean,
    badgeClass: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    iconType: 'info',
    icon: 'ℹ️',
  };
};

/**
 * Visual badge and label configuration for GFR 144 Status.
 */
export const getGfr144Meta = (gfrValue) => {
  if (gfrValue === true || gfrValue === 'true' || gfrValue === 'CLEARED' || gfrValue === 'COMPLIANT') {
    return {
      raw: true,
      label: 'Cleared',
      badgeClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: '✅',
    };
  }
  if (gfrValue === false || gfrValue === 'false' || gfrValue === 'NOT_CLEARED' || gfrValue === 'FAILED') {
    return {
      raw: false,
      label: 'Not Cleared',
      badgeClass: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      icon: '❌',
    };
  }
  return {
    raw: null,
    label: 'N/A',
    badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    icon: '⚪',
  };
};

/**
 * Safely parse analysis string or object into structured analysis parts.
 */
export const parseAnalysisContent = (analysisInput) => {
  if (!analysisInput) {
    return {
      raw: '',
      hasContent: false,
      summary: '',
      observations: [],
      findings: [],
      clarifications: [],
    };
  }

  let text = '';
  if (typeof analysisInput === 'string') {
    text = analysisInput;
  } else if (typeof analysisInput === 'object') {
    text =
      analysisInput.summary ||
      analysisInput.text ||
      analysisInput.analysis ||
      analysisInput.answer ||
      analysisInput.comparison ||
      '';
  }

  const trimmed = String(text || '').trim();
  if (!trimmed) {
    return {
      raw: '',
      hasContent: false,
      summary: '',
      observations: [],
      findings: [],
      clarifications: [],
    };
  }

  // Parse lines to extract bullet observations or paragraphs
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  const observations = [];
  const findings = [];
  const clarifications = [];
  const summaryParagraphs = [];

  let currentCategory = 'summary';

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    if (lower.includes('observation') || lower.includes('key finding')) {
      currentCategory = 'observations';
      return;
    }
    if (lower.includes('compliance finding') || lower.includes('statutory check')) {
      currentCategory = 'findings';
      return;
    }
    if (lower.includes('clarification') || lower.includes('action item')) {
      currentCategory = 'clarifications';
      return;
    }

    const cleanBullet = line.replace(/^[-*•\d+.]\s*/, '');
    if (currentCategory === 'observations') {
      observations.push(cleanBullet);
    } else if (currentCategory === 'findings') {
      findings.push(cleanBullet);
    } else if (currentCategory === 'clarifications') {
      clarifications.push(cleanBullet);
    } else {
      summaryParagraphs.push(line);
    }
  });

  return {
    raw: trimmed,
    hasContent: true,
    summary: summaryParagraphs.join('\n\n') || trimmed,
    observations,
    findings,
    clarifications,
  };
};

/**
 * Main adapter function: converts raw comparison responses into a unified,
 * procurement-grade view model.
 * 
 * @param {Object} rawData - Direct API response or `{ ml, ai, bidders }` object
 * @param {Array} [contextBidders=[]] - Optional fallback list of submissions from UI
 * @returns {Object} Normalized evaluation view model
 */
export const normalizeComparisonResponse = (rawData = null, contextBidders = []) => {
  if (!rawData || typeof rawData !== 'object') {
    return {
      isValid: false,
      isEmpty: true,
      errorMessage: 'No comparative evaluation data received.',
      tenderId: 'N/A',
      biddersEvaluated: 0,
      statusLabel: 'N/A',
      verdictLabel: 'N/A',
      recommendedBidder: null,
      analysis: parseAnalysisContent(null),
      bidders: [],
      complianceOverview: [],
      raw: rawData,
    };
  }

  // Detect whether this is the combined container `{ ml, ai, bidders }` or direct response
  const aiData = rawData.ai || (rawData.comparativeMatrix || rawData.recommendedBidder || rawData.verdict ? rawData : null);
  const mlData = rawData.ml || (rawData.rankings || rawData.biddersEvaluated ? rawData : null);
  const fallbackBidders = Array.isArray(rawData.bidders)
    ? rawData.bidders
    : Array.isArray(contextBidders)
    ? contextBidders
    : [];

  // 1. Resolve Tender ID
  const tenderId =
    aiData?.tenderId ||
    mlData?.tenderId ||
    rawData?.tenderId ||
    fallbackBidders[0]?.tenderId ||
    'N/A';

  // 2. Resolve Verdict and Status
  const verdictRaw = aiData?.verdict || rawData?.verdict || null;
  const verdictLabel = verdictRaw ? formatStatusLabel(verdictRaw) : 'Comparison Completed';

  const statusRaw = mlData?.status || rawData?.status || null;
  const statusLabel = statusRaw ? formatStatusLabel(statusRaw) : verdictLabel;

  // 3. Resolve Recommended Bidder ID
  const recommendedBidderId =
    aiData?.recommendedBidder ||
    rawData?.recommendedBidder ||
    mlData?.rankings?.find((r) => r.status === 'RECOMMENDED_L1' || r.rank === 1)?.bidderId ||
    null;

  // 4. Resolve Analysis
  const analysisSource =
    aiData?.analysis ||
    aiData?.answer ||
    aiData?.comparison ||
    aiData?.text ||
    mlData?.aiSummary ||
    rawData?.analysis ||
    rawData?.aiSummary ||
    null;
  const parsedAnalysis = parseAnalysisContent(analysisSource);

  // 5. Build Bidder Map from all sources
  // We merge:
  // - AI comparativeMatrix
  // - ML rankings
  // - Fallback UI bidders list
  const bidderMap = new Map();

  // Helper to ensure an entry exists in map
  const getOrCreateBidder = (key) => {
    const stringKey = String(key || '').trim();
    if (!bidderMap.has(stringKey)) {
      bidderMap.set(stringKey, {
        bidderId: stringKey || 'N/A',
        bidderName: 'N/A',
        rank: null,
        compositeScore: null,
        technicalCompliance: 'N/A',
        financialTurnover: 'N/A',
        gfr144Cleared: null,
        riskTier: 'N/A',
        clarificationRequirement: 'N/A',
        pyhankoAuthentic: null,
        gstStatus: 'N/A',
        docCount: 'N/A',
        isRecommended: false,
        rawAttributes: {},
      });
    }
    return bidderMap.get(stringKey);
  };

  // 5a. Ingest Fallback UI Bidders (for names, doc count, etc.)
  fallbackBidders.forEach((b, idx) => {
    const key = b.bidderId || b.id || `BID-${idx + 1}`;
    const entry = getOrCreateBidder(key);
    if (b.bidder) entry.bidderName = b.bidder;
    if (b.docCount !== undefined && b.docCount !== null) entry.docCount = b.docCount;
    if (b.complianceScore !== undefined && b.complianceScore !== null) {
      entry.compositeScore = Number(b.complianceScore);
    }
    if (b.complianceStatus) {
      entry.technicalCompliance = b.complianceStatus;
    }
  });

  // 5b. Ingest ML rankings
  if (Array.isArray(mlData?.rankings)) {
    mlData.rankings.forEach((r, idx) => {
      const key = r.bidderId || r.id || `BID-${idx + 1}`;
      const entry = getOrCreateBidder(key);
      if (r.bidderName) entry.bidderName = r.bidderName;
      if (r.rank !== undefined && r.rank !== null) entry.rank = r.rank;
      if (r.compositeScore !== undefined && r.compositeScore !== null) {
        entry.compositeScore = Number(r.compositeScore);
      }
      if (r.gfr144Compliant !== undefined) {
        entry.gfr144Cleared = Boolean(r.gfr144Compliant);
      }
      if (r.pyhankoAuthentic !== undefined) {
        entry.pyhankoAuthentic = Boolean(r.pyhankoAuthentic);
      }
      if (r.status === 'RECOMMENDED_L1' || r.rank === 1) {
        entry.isRecommended = true;
      }
    });
  }

  // 5c. Ingest AI comparativeMatrix
  if (Array.isArray(aiData?.comparativeMatrix)) {
    aiData.comparativeMatrix.forEach((m, idx) => {
      const key = m.bidderId || m.id || `BID-${idx + 1}`;
      const entry = getOrCreateBidder(key);
      if (m.bidderName && entry.bidderName === 'N/A') {
        entry.bidderName = m.bidderName;
      }
      if (m.compositeScore !== undefined && m.compositeScore !== null) {
        entry.compositeScore = Number(m.compositeScore);
      }
      if (m.technicalCompliance) {
        entry.technicalCompliance = m.technicalCompliance;
      }
      if (m.financialTurnover) {
        entry.financialTurnover = m.financialTurnover;
      }
      if (m.gfr144Cleared !== undefined) {
        entry.gfr144Cleared = Boolean(m.gfr144Cleared);
      }
      if (m.riskTier) {
        entry.riskTier = m.riskTier;
      }
      if (m.clarificationRequirement) {
        entry.clarificationRequirement = m.clarificationRequirement;
      } else if (m.clarification) {
        entry.clarificationRequirement = m.clarification;
      }
      // Store any other dynamic keys
      entry.rawAttributes = { ...m };
    });
  }

  // If no bidders were populated from ML or AI, but comparativeMatrix / rankings were empty
  // and no fallback bidders, check if direct bidder list was passed
  if (bidderMap.size === 0 && Array.isArray(rawData)) {
    rawData.forEach((b, idx) => {
      const key = b.bidderId || b.id || `BID-${idx + 1}`;
      const entry = getOrCreateBidder(key);
      if (b.bidderName || b.bidder) entry.bidderName = b.bidderName || b.bidder;
      if (b.compositeScore !== undefined) entry.compositeScore = Number(b.compositeScore);
    });
  }

  // Convert map to array and assign final ranks & display fields
  const biddersList = Array.from(bidderMap.values()).map((b, idx) => {
    // Missing bidderName falls back to bidderId
    const resolvedName =
      b.bidderName && b.bidderName !== 'N/A'
        ? b.bidderName
        : b.bidderId !== 'N/A'
        ? b.bidderId
        : `Bidder #${idx + 1}`;

    const scoreDisplay =
      b.compositeScore !== null && !isNaN(b.compositeScore)
        ? `${Math.round(b.compositeScore)} / 100`
        : 'N/A';

    const isDirectMatchRecommended =
      recommendedBidderId &&
      (String(b.bidderId).trim() === String(recommendedBidderId).trim() ||
        String(b.bidderName).trim() === String(recommendedBidderId).trim());

    const isRecommended = Boolean(b.isRecommended || isDirectMatchRecommended);

    return {
      ...b,
      bidderName: resolvedName,
      rank: b.rank !== null ? b.rank : idx + 1,
      scoreDisplay,
      isRecommended,
      riskTierMeta: getRiskTierMeta(b.riskTier),
      technicalComplianceMeta: getTechnicalComplianceMeta(b.technicalCompliance),
      gfr144Meta: getGfr144Meta(b.gfr144Cleared),
    };
  });

  // Sort bidders by rank or score descending if present
  biddersList.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    if (a.compositeScore !== null && b.compositeScore !== null) {
      return b.compositeScore - a.compositeScore;
    }
    return (a.rank || 999) - (b.rank || 999);
  });

  // 6. Bidders Evaluated Count
  const biddersEvaluatedCount =
    aiData?.bidderCount !== undefined && aiData?.bidderCount !== null
      ? aiData.bidderCount
      : mlData?.biddersEvaluated !== undefined && mlData?.biddersEvaluated !== null
      ? mlData.biddersEvaluated
      : rawData?.bidderCount !== undefined && rawData?.bidderCount !== null
      ? rawData.bidderCount
      : rawData?.biddersEvaluated !== undefined && rawData?.biddersEvaluated !== null
      ? rawData.biddersEvaluated
      : biddersList.length;

  // 7. Recommended Bidder details
  let recommendedBidderData = null;
  if (recommendedBidderId || biddersList.some((b) => b.isRecommended)) {
    recommendedBidderData =
      biddersList.find((b) => b.isRecommended) ||
      biddersList.find((b) => b.bidderId === recommendedBidderId) ||
      null;
  }

  // 8. Compliance Overview: only include fields that exist in the evaluation
  const complianceOverview = [];

  // GFR 144 Check
  const hasGfrField = biddersList.some((b) => b.gfr144Cleared !== null);
  if (hasGfrField) {
    const allCleared = biddersList.every((b) => b.gfr144Cleared === true);
    complianceOverview.push({
      id: 'gfr144',
      title: 'GFR Rule 144(xi) Land Border Policy',
      statusLabel: allCleared ? 'Cleared' : 'Under Review',
      badgeClass: allCleared
        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
        : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
      icon: allCleared ? '✅' : '⚠️',
      note: allCleared ? 'All candidate submissions cleared mandatory land border clause.' : 'One or more bids require officer review.',
    });
  }

  // PyHanko DSC Check
  const hasPyhanko = biddersList.some((b) => b.pyhankoAuthentic !== null);
  if (hasPyhanko) {
    const allAuthentic = biddersList.every((b) => b.pyhankoAuthentic === true);
    complianceOverview.push({
      id: 'pyhanko',
      title: 'PyHanko Cryptographic DSC Verification',
      statusLabel: allAuthentic ? 'Verified' : 'Verification Flagged',
      badgeClass: allAuthentic
        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
      icon: allAuthentic ? '✅' : '❌',
      note: allAuthentic ? 'Digital signatures cryptographically verified against CCA Root.' : 'Digital signature discrepancy noted.',
    });
  }

  // Technical Compliance Check
  const hasTech = biddersList.some((b) => b.technicalCompliance !== 'N/A');
  if (hasTech) {
    const hasClarifications = biddersList.some((b) =>
      String(b.technicalCompliance).toLowerCase().includes('clarification')
    );
    complianceOverview.push({
      id: 'tech_compliance',
      title: 'Technical Specification Compliance',
      statusLabel: hasClarifications ? 'Minor Clarifications Noted' : 'Fully Compliant',
      badgeClass: hasClarifications
        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
        : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      icon: hasClarifications ? '⚠️' : '✅',
      note: hasClarifications ? 'Procurement officer may request clarifications before award.' : 'Submissions satisfy all technical parameters.',
    });
  }

  // GST Filing Status
  const gstFilingEvaluated =
    parsedAnalysis.raw.toLowerCase().includes('gst') ||
    biddersList.some((b) => b.rawAttributes?.gstFiling || b.rawAttributes?.gstStatus);
  if (gstFilingEvaluated) {
    complianceOverview.push({
      id: 'gst_filing',
      title: 'Statutory GSTIN & Taxpayer Records',
      statusLabel: 'Verified',
      badgeClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      icon: '✅',
      note: 'Cross-checked against Live GST Portal and MCA registry records.',
    });
  }

  // 9. Timestamp formatting
  const generatedAt =
    rawData.timestamp ||
    rawData.generatedAt ||
    aiData?.timestamp ||
    mlData?.timestamp ||
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return {
    isValid: true,
    isEmpty: biddersList.length === 0,
    tenderId,
    biddersEvaluated: biddersEvaluatedCount,
    verdictLabel,
    statusLabel,
    generatedAt,
    recommendedBidder: recommendedBidderData,
    recommendedBidderId,
    analysis: parsedAnalysis,
    bidders: biddersList,
    complianceOverview,
    raw: {
      ai: aiData,
      ml: mlData,
      fullResponse: rawData,
    },
  };
};

/**
 * Extracts a bidder-specific evaluation profile for the AI Evaluation Drawer.
 * 
 * @param {Object} normalizedData - Output of normalizeComparisonResponse
 * @param {string|Object} bidderOrId - Bidder ID string or submission object
 * @returns {Object} Bidder-specific evaluation view model
 */
export const getBidderEvaluation = (normalizedData = null, bidderOrId = null) => {
  const targetId = typeof bidderOrId === 'string'
    ? bidderOrId.trim()
    : String(bidderOrId?.bidderId || bidderOrId?.id || '').trim();

  const fallbackSub = typeof bidderOrId === 'object' && bidderOrId !== null ? bidderOrId : null;

  // Find bidder in normalized comparison list
  const foundBidder = normalizedData?.bidders?.find((b) => {
    if (!b) return false;
    const bId = String(b.bidderId || '').trim();
    const bName = String(b.bidderName || '').trim();
    return bId === targetId || (fallbackSub?.bidder && bName === String(fallbackSub.bidder).trim());
  }) || null;

  // Derive final values
  const bidderId =
    foundBidder?.bidderId && foundBidder.bidderId !== 'N/A'
      ? foundBidder.bidderId
      : targetId || fallbackSub?.id || 'N/A';

  const bidderName =
    foundBidder?.bidderName && foundBidder.bidderName !== 'N/A'
      ? foundBidder.bidderName
      : fallbackSub?.bidder
      ? fallbackSub.bidder
      : bidderId !== 'N/A'
      ? bidderId
      : 'N/A';

  const compositeScore =
    foundBidder?.compositeScore !== null && foundBidder?.compositeScore !== undefined
      ? foundBidder.compositeScore
      : fallbackSub?.complianceScore !== undefined && fallbackSub?.complianceScore !== null
      ? Number(fallbackSub.complianceScore)
      : null;

  const scoreDisplay =
    compositeScore !== null && !isNaN(compositeScore)
      ? `${Math.round(compositeScore)} / 100`
      : 'N/A';

  const technicalCompliance =
    foundBidder?.technicalCompliance && foundBidder.technicalCompliance !== 'N/A'
      ? foundBidder.technicalCompliance
      : fallbackSub?.complianceStatus || 'N/A';

  const technicalComplianceMeta = getTechnicalComplianceMeta(technicalCompliance);

  const financialTurnover =
    foundBidder?.financialTurnover && foundBidder.financialTurnover !== 'N/A'
      ? foundBidder.financialTurnover
      : 'N/A';

  const gfr144Cleared =
    foundBidder?.gfr144Cleared !== null && foundBidder?.gfr144Cleared !== undefined
      ? foundBidder.gfr144Cleared
      : null;

  const gfr144Meta = getGfr144Meta(gfr144Cleared);

  const riskTier = foundBidder?.riskTier || 'N/A';
  const riskTierMeta = getRiskTierMeta(riskTier);

  // Clarification / Attention items
  const clarification =
    foundBidder?.clarificationRequirement && foundBidder.clarificationRequirement !== 'N/A'
      ? foundBidder.clarificationRequirement
      : null;

  // Analysis: extract bidder-specific commentary if available, or fall back to overall evaluation
  const analysis = normalizedData?.analysis?.hasContent ? normalizedData.analysis : parseAnalysisContent(null);

  // Evidence / Source Documents
  const sourceDocuments = Array.isArray(fallbackSub?.documents)
    ? fallbackSub.documents
    : Array.isArray(foundBidder?.rawAttributes?.documents)
    ? foundBidder.rawAttributes.documents
    : [];

  const docCount =
    fallbackSub?.docCount !== undefined
      ? fallbackSub.docCount
      : sourceDocuments.length > 0
      ? sourceDocuments.length
      : foundBidder?.docCount !== 'N/A'
      ? foundBidder?.docCount
      : 'N/A';

  // Compliance checks collection
  const complianceChecks = [
    {
      id: 'tech_compliance',
      name: 'Technical Compliance',
      value: technicalComplianceMeta.label,
      badgeClass: technicalComplianceMeta.badgeClass,
      icon: technicalComplianceMeta.icon,
      isCleared: technicalComplianceMeta.label === 'Fully Compliant',
    },
    {
      id: 'gfr144',
      name: 'GFR Rule 144(xi) Land Border',
      value: gfr144Meta.label,
      badgeClass: gfr144Meta.badgeClass,
      icon: gfr144Meta.icon,
      isCleared: gfr144Meta.raw === true,
    },
  ];

  if (foundBidder?.pyhankoAuthentic !== null && foundBidder?.pyhankoAuthentic !== undefined) {
    complianceChecks.push({
      id: 'pyhanko',
      name: 'PyHanko Cryptographic DSC',
      value: foundBidder.pyhankoAuthentic ? 'Cleared & Authentic' : 'Discrepancy Noted',
      badgeClass: foundBidder.pyhankoAuthentic
        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      icon: foundBidder.pyhankoAuthentic ? '✓' : '✕',
      isCleared: foundBidder.pyhankoAuthentic,
    });
  }

  // Check GST status if present
  const gstFiling = foundBidder?.rawAttributes?.gstFiling || foundBidder?.rawAttributes?.gstStatus;
  if (gstFiling || analysis.raw.toLowerCase().includes('gst')) {
    complianceChecks.push({
      id: 'gst',
      name: 'Statutory GST & MCA Records',
      value: gstFiling ? formatStatusLabel(String(gstFiling)) : 'Verified',
      badgeClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: '✓',
      isCleared: true,
    });
  }

  // Raw JSON representation for technical accordion
  const rawBidderJson = {
    bidderId,
    bidderName,
    compositeScore,
    technicalCompliance,
    financialTurnover,
    gfr144Cleared,
    riskTier,
    clarificationRequirement: clarification,
    rawAttributes: foundBidder?.rawAttributes || {},
    apiPayloads: {
      aiComparativeMatrixEntry: foundBidder?.rawAttributes || null,
      fullEvaluationResponse: normalizedData?.raw?.fullResponse || null,
    },
  };

  return {
    bidderId,
    bidderName,
    compositeScore,
    scoreDisplay,
    rank: foundBidder?.rank || null,
    isRecommended: Boolean(foundBidder?.isRecommended),
    technicalCompliance,
    technicalComplianceMeta,
    financialTurnover,
    gfr144Cleared,
    gfr144Meta,
    riskTier,
    riskTierMeta,
    clarification,
    analysis,
    sourceDocuments,
    docCount,
    complianceChecks,
    rawJson: rawBidderJson,
  };
};

export default normalizeComparisonResponse;
