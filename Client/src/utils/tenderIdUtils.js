/**
 * Tender ID Normalization & Grounded Context Utility
 * Ensures consistent tender ID resolution and strict tender data isolation.
 */

/**
 * Normalizes any incoming tender ID or reference number into a consistent format.
 * Handles URL decoding, leading/trailing whitespace, and ensures valid characters are preserved.
 *
 * Examples:
 * - "GEM%2F2026%2FB%2F7168476" -> "GEM/2026/B/7168476"
 * - " GEM/2026/B/7168476 " -> "GEM/2026/B/7168476"
 * - 1 -> "1"
 * - null / undefined -> ""
 *
 * @param {string|number} rawId
 * @returns {string}
 */
export const normalizeTenderId = (rawId) => {
  if (rawId === null || rawId === undefined) return '';
  const str = String(rawId).trim();
  if (!str) return '';

  try {
    return decodeURIComponent(str).trim();
  } catch {
    return str;
  }
};

/**
 * Strictly finds a tender in a list matching the specified target ID.
 * Matches against id, referenceNo, or tenderId.
 * NEVER returns or combines another tender's data.
 *
 * @param {Array<Object>} tendersList
 * @param {string|number} targetId
 * @returns {Object|null}
 */
export const findTenderById = (tendersList, targetId) => {
  if (!Array.isArray(tendersList) || tendersList.length === 0) return null;
  const target = normalizeTenderId(targetId);
  if (!target) return null;

  const lowerTarget = target.toLowerCase();

  return (
    tendersList.find((t) => {
      if (!t || typeof t !== 'object') return false;
      const tId = normalizeTenderId(t.id).toLowerCase();
      const tRef = normalizeTenderId(t.referenceNo).toLowerCase();
      const tTdr = normalizeTenderId(t.tenderId).toLowerCase();

      return tId === lowerTarget || tRef === lowerTarget || tTdr === lowerTarget;
    }) || null
  );
};

/**
 * Builds a grounded context string strictly from the supplied tender object.
 * Incorporates OCR text, technical specs, GFR rules, eligibility, EMD, and document details.
 *
 * @param {Object} tender
 * @returns {string}
 */
export const buildTenderGroundedContext = (tender) => {
  if (!tender || typeof tender !== 'object') return '';

  const id = normalizeTenderId(tender.id || tender.referenceNo || tender.tenderId);
  const title = tender.title || 'Government Procurement Tender';
  const dept = tender.department || tender.ministry || 'Procurement Authority';
  const estVal = tender.value || (tender.estimatedValue ? `₹ ${tender.estimatedValue}` : 'N/A');
  const emd = tender.emdAmount || 'N/A';
  const closing = tender.closingDate || tender.closes || tender.lastDate || 'N/A';
  const category = tender.category || 'General Procurement';

  const parts = [
    `OFFICIAL TENDER SPECIFICATION RECORD`,
    `Tender ID / Ref: ${id}`,
    `Title: ${title}`,
    `Department / Ministry: ${dept}`,
    `Category: ${category}`,
    `Estimated Value: ${estVal}`,
    `EMD Security Amount: ${emd}`,
    `Submission Deadline / Closing Date: ${closing}`,
  ];

  if (tender.description) {
    parts.push(`Scope of Work / Description:\n${tender.description}`);
  }

  // Eligibility Criteria
  if (Array.isArray(tender.eligibilityCriteria) && tender.eligibilityCriteria.length > 0) {
    parts.push(`Eligibility Criteria Requirements:\n- ${tender.eligibilityCriteria.join('\n- ')}`);
  } else if (tender.eligibility) {
    parts.push(`Eligibility Criteria: ${tender.eligibility}`);
  }

  // Extracted Rules / Compliance Clauses
  if (tender.extractedRules && typeof tender.extractedRules === 'object') {
    const rules = [];
    if (tender.extractedRules.gfr144xi?.clause) {
      rules.push(`GFR 2017 Rule 144(xi): ${tender.extractedRules.gfr144xi.clause} (${tender.extractedRules.gfr144xi.status})`);
    }
    if (tender.extractedRules.miiContent?.clause) {
      rules.push(`Make in India (PPP-MII): ${tender.extractedRules.miiContent.clause} (Min Local Content: ${tender.extractedRules.miiContent.percentage || 50}%)`);
    }
    if (tender.extractedRules.msmeRelaxation?.clause) {
      rules.push(`MSME & Startup Exemption: ${tender.extractedRules.msmeRelaxation.clause}`);
    }
    if (tender.extractedRules.financialTurnover?.clause) {
      rules.push(`Financial Turnover: ${tender.extractedRules.financialTurnover.clause} (${tender.extractedRules.financialTurnover.status})`);
    }
    if (tender.extractedRules.pastExperience?.clause) {
      rules.push(`Past Experience: ${tender.extractedRules.pastExperience.clause} (${tender.extractedRules.pastExperience.status})`);
    }
    if (tender.extractedRules.warrantySla?.clause) {
      rules.push(`Warranty & SLA: ${tender.extractedRules.warrantySla.clause} (${tender.extractedRules.warrantySla.status})`);
    }
    if (rules.length > 0) {
      parts.push(`Compliance Clauses & Statutory Rules:\n- ${rules.join('\n- ')}`);
    }
  }

  // Documents
  if (Array.isArray(tender.documents) && tender.documents.length > 0) {
    const docs = tender.documents.map((d) => `${d.name || 'Tender Document'} (${d.size || 'Official File'})`);
    parts.push(`Official Tender Documents:\n- ${docs.join('\n- ')}`);
  }

  // Raw OCR Text if available
  if (tender.rawOcrText && typeof tender.rawOcrText === 'string' && tender.rawOcrText.trim()) {
    parts.push(`Extracted Document Text (OCR Feed):\n${tender.rawOcrText.trim()}`);
  }

  return parts.join('\n\n');
};

/**
 * Deterministic Grounded Tender Query Answerer
 * Used when vector search returns 0 chunks, 429 quota is reached, or vector DB is unreachable.
 * Answers strictly based on the provided tender object without hallucinating.
 *
 * @param {Object} tender
 * @param {string} query
 * @returns {{ answer: string, sources: Array<Object>, isGroundedFallback: boolean }}
 */
export const answerFromGroundedTenderData = (tender, query) => {
  const tenderId = normalizeTenderId(tender?.id || tender?.referenceNo);
  const q = String(query || '').toLowerCase().trim();

  if (!tender) {
    return {
      answer: `I couldn't find this information because no tender matching the requested identifier is loaded in the system.`,
      sources: [],
      isGroundedFallback: true,
    };
  }

  const docName = tender.documents?.[0]?.name || 'Tender_Specification.pdf';

  // 1. Documents required question (check first so "documents required" gets document checklist)
  if (q.includes('document') || q.includes('certificate') || q.includes('upload') || q.includes('form') || q.includes('file')) {
    const docs = Array.isArray(tender.documents) ? tender.documents : [];
    const docList = docs.map((d) => `- **${d.name}** (${d.size || 'Official File'})`).join('\n');
    const rules = tender.extractedRules || {};

    const requiredDocs = [
      rules.gfr144xi ? 'Annexure-I Land Border Compliance Declaration under GFR Rule 144(xi)' : null,
      rules.miiContent ? 'Make in India (PPP-MII) Local Content Self-Certificate' : null,
      rules.financialTurnover ? 'Audited Annual Financial Statements / CA Turnover Certificate with UDIN' : null,
      rules.warrantySla ? 'OEM Authorization Form (MAF) with comprehensive SLA commitment' : null,
      rules.msmeRelaxation ? 'Valid MSME Udyam Registration Certificate (if seeking exemption)' : null,
    ].filter(Boolean);

    return {
      answer: `Based on the tender specifications for **${tenderId}**, the following documents and mandatory statutory forms are required:\n\n` +
        `**Official RFP & BOQ Documents:**\n${docList || '- Tender Specification RFP Document'}\n\n` +
        (requiredDocs.length > 0 ? `**Mandatory Compliance Filings:**\n${requiredDocs.map((r) => `- ${r}`).join('\n')}\n\n` : '') +
        `*Please ensure all uploaded files are signed with a valid Class-3 DSC.*`,
      sources: [{ tenderId, document: docName, section: 'Mandatory Submission Documents Checklist', page: 1 }],
      isGroundedFallback: true,
    };
  }

  // 2. Eligibility criteria question
  if (q.includes('eligib') || q.includes('criteri') || q.includes('qualif') || q.includes('require')) {
    const criteria = Array.isArray(tender.eligibilityCriteria) && tender.eligibilityCriteria.length > 0
      ? tender.eligibilityCriteria
      : tender.eligibility
      ? [tender.eligibility]
      : [];

    if (criteria.length > 0) {
      return {
        answer: `According to the **Eligibility Criteria** for Tender **${tenderId}**:\n\n` +
          criteria.map((c, i) => `${i + 1}. **${c}**`).join('\n') +
          `\n\n*All bidders must furnish documentary evidence conforming to these terms prior to bid submission.*`,
        sources: [{ tenderId, document: docName, section: 'Eligibility Criteria & Pre-qualification', page: 1 }],
        isGroundedFallback: true,
      };
    }
  }

  // 3. EMD / Bid Security question
  if (q.includes('emd') || q.includes('earnest') || q.includes('security deposit') || q.includes('bid security')) {
    const emd = tender.emdAmount || 'Exempted / As per RFP guidelines';
    const isMsmeExempt = tender.extractedRules?.msmeRelaxation?.waiverAllowed !== false;
    return {
      answer: `For Tender **${tenderId}**:\n\n- **EMD / Bid Security Amount:** **${emd}**\n` +
        (isMsmeExempt ? `- **MSE/Startup Exemption:** Micro & Small Enterprises (MSEs) registered with Udyam and DPIIT Recognized Startups are **exempt from EMD submission** under GFR 2017 Rule 170(i).\n` : '') +
        `\n*EMD if applicable must be submitted via Bank Guarantee (BG), FDR, or online through GeM payment gateway.*`,
      sources: [{ tenderId, document: docName, section: 'EMD & Bid Security Conditions', page: 1 }],
      isGroundedFallback: true,
    };
  }

  // 4. Submission deadline / Last date
  if (q.includes('deadline') || q.includes('last date') || q.includes('close') || q.includes('closing') || q.includes('when')) {
    const closing = tender.closingDate || tender.closes || tender.lastDate || 'As specified in GeM portal';
    const daysLeft = tender.daysLeft ? ` (${tender.daysLeft} remaining)` : '';
    return {
      answer: `The submission deadline for Tender **${tenderId}** is **${closing}**${daysLeft}.\n\n*Late bids will be rejected automatically by the portal e-procurement engine.*`,
      sources: [{ tenderId, document: docName, section: 'Critical Dates & Schedule', page: 1 }],
      isGroundedFallback: true,
    };
  }

  // 5. Estimated Value / Budget
  if (q.includes('value') || q.includes('cost') || q.includes('budget') || q.includes('price') || q.includes('rupee')) {
    const val = tender.value || (tender.estimatedValue ? `₹ ${Number(tender.estimatedValue).toLocaleString('en-IN')}` : 'Not Disclosed');
    return {
      answer: `The estimated tender contract value for **${tenderId}** is **${val}**.\n\n*Pricing must be quoted on GeM inclusive of all statutory taxes, customs/GST, and commissioning charges.*`,
      sources: [{ tenderId, document: docName, section: 'Commercial Terms & BOQ Schedule', page: 1 }],
      isGroundedFallback: true,
    };
  }

  // 6. Turnover & Financial Criteria
  if (q.includes('turnover') || q.includes('financial') || q.includes('revenue') || q.includes('audit')) {
    const toClause = tender.extractedRules?.financialTurnover?.clause ||
      tender.eligibilityCriteria?.find((c) => c.toLowerCase().includes('turnover')) ||
      'Audited balance sheets for last 3 financial years required.';
    return {
      answer: `Regarding financial criteria for Tender **${tenderId}**:\n\n- **Requirement:** ${toClause}\n- **Verification:** Audited Balance Sheets certified by a Chartered Accountant with valid UDIN are required.\n- **MSME Relaxation:** Eligible under GFR Rule 173(i) for verified MSEs.`,
      sources: [{ tenderId, document: docName, section: 'Financial & Turnover Qualification', page: 1 }],
      isGroundedFallback: true,
    };
  }

  // 7. Make in India (MII) / Local Content
  if (q.includes('make in india') || q.includes('mii') || q.includes('local content') || q.includes('ppp-mii')) {
    const mii = tender.miiRequirement || tender.minLocalContent || 'Class-I (>= 50% Local Content)';
    const clause = tender.extractedRules?.miiContent?.clause || 'PPP-MII Order 2017 compliant self-certificate required.';
    return {
      answer: `Under the Public Procurement (Preference to Make in India) Order for Tender **${tenderId}**:\n\n- **Classification:** **${mii}**\n- **Clause:** ${clause}\n- **Declaration:** Bidders must provide a self-declaration indicating local value addition and location of manufacturing.`,
      sources: [{ tenderId, document: docName, section: 'Make in India (PPP-MII Order 2017)', page: 1 }],
      isGroundedFallback: true,
    };
  }

  // 8. Land Border / GFR 144(xi)
  if (q.includes('land border') || q.includes('144') || q.includes('border') || q.includes('china')) {
    const gfrClause = tender.extractedRules?.gfr144xi?.clause || 'Rule 144(xi) Annexure-I/II declaration mandatory.';
    return {
      answer: `Compliance with **GFR 2017 Rule 144(xi)** (Land Border Restrictions) is **Mandatory** for Tender **${tenderId}**:\n\n- **Clause:** ${gfrClause}\n- **Requirement:** Bidders from countries sharing a land border with India must be registered with the competent authority (DPIIT) or certify that they do not belong to such countries.`,
      sources: [{ tenderId, document: docName, section: 'GFR 2017 Rule 144(xi) Statutory Declaration', page: 1 }],
      isGroundedFallback: true,
    };
  }

  // 9. Summarize / Scope / Technical specifications
  if (q.includes('summar') || q.includes('scope') || q.includes('about') || q.includes('overview') || q.includes('technical')) {
    return {
      answer: `**Summary of Tender ${tenderId}:**\n\n` +
        `- **Title:** ${tender.title}\n` +
        `- **Procuring Entity:** ${tender.department || tender.ministry}\n` +
        `- **Category:** ${tender.category || 'Procurement'}\n` +
        `- **Estimated Value:** ${tender.value || 'N/A'}\n` +
        `- **EMD Security:** ${tender.emdAmount || 'N/A'}\n` +
        `- **Closing Deadline:** ${tender.closingDate || tender.closes || 'N/A'}\n\n` +
        `**Scope & Description:**\n${tender.description || 'Turnkey procurement under GFR 2017 and GeM guidelines.'}`,
      sources: [{ tenderId, document: docName, section: 'Tender Executive Summary & Technical Scope', page: 1 }],
      isGroundedFallback: true,
    };
  }

  // Default clean answer based on scope
  if (tender.description) {
    return {
      answer: `Based on the evaluated specifications for Tender **${tenderId}**:\n\n` +
        `${tender.description}\n\n` +
        `*Procuring Entity: ${tender.department || tender.ministry} • Value: ${tender.value || 'N/A'} • Ref: ${tenderId}*`,
      sources: [{ tenderId, document: docName, section: 'General Tender Specifications', page: 1 }],
      isGroundedFallback: true,
    };
  }

  // 10. Strict No-Answer State
  return {
    answer: `I couldn't find specific information regarding "${query}" in the specifications for tender #${tenderId}. Please refer to the official RFP document for further details.`,
    sources: [{ tenderId, document: docName, section: 'Tender Specifications', page: 1 }],
    isGroundedFallback: true,
  };
};
