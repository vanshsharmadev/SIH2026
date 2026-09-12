// converting ML returned object as RAG-friendly text

function parseSummary(summary) {
  if (!summary || typeof summary !== "object") {
    throw new Error("Valid ML summary object is required");
  }

  const integrated = summary.integrated_summary || summary;

  const prediction = integrated.ml_compliance_prediction || {};
  const documentStats = integrated.document_statistics || {};
  const cisSummary = integrated.cis_summary || {};
  const authenticity = integrated.authenticity_summary || {};
  const prosAndCons = integrated.pros_and_cons || {};
  const botAnalysis = integrated.bot_deduction_analysis || {};

  const deductions = botAnalysis.itemized_deductions || [];

  const text = `
BIDDER COMPLIANCE ANALYSIS

Overall Assessment:
Overall verdict: ${integrated.overall_verdict || "Not available"}.
Verdict description: ${
    integrated.verdict_description || "Not available"
  }.
Executive summary: ${
    integrated.executive_summary || "Not available"
  }.
Fake documents detected: ${
    integrated.has_fake_documents ?? "Not available"
  }.

ML Compliance Prediction:
Predicted verdict: ${
    prediction.predicted_verdict || "Not available"
  }.
Regressed CIS score: ${
    prediction.regressed_cis_score ?? "Not available"
  }.
Prediction confidence: ${
    prediction.confidence ?? "Not available"
  }.
Prediction method: ${
    prediction.method || "Not available"
  }.
Approved: ${prediction.is_approved ?? "Not available"}.
Requires review: ${
    prediction.requires_review ?? "Not available"
  }.
Rejected: ${prediction.is_rejected ?? "Not available"}.
Fake document detected: ${
    prediction.is_fake_detected ?? "Not available"
  }.

Document Statistics:
Total documents submitted: ${
    documentStats.total_documents_submitted ?? "Not available"
  }.
Submitted document types: ${
    documentStats.submitted_document_types?.join(", ") ||
    "None"
  }.
Mandatory documents required: ${
    documentStats.mandatory_documents_required?.join(", ") ||
    "None"
  }.
Missing mandatory documents: ${
    documentStats.missing_mandatory_documents?.join(", ") ||
    "None"
  }.
Optional documents submitted: ${
    documentStats.optional_documents_submitted?.join(", ") ||
    "None"
  }.
Completeness ratio: ${
    documentStats.completeness_ratio || "Not available"
  }.

CIS Analysis:
CIS score: ${
    cisSummary.cis_score ?? "Not available"
  }.
CIS percentage: ${
    cisSummary.cis_percentage || "Not available"
  }.
Risk classification: ${
    cisSummary.risk_classification || "Not available"
  }.
Tender type: ${
    cisSummary.tender_type || "Not available"
  }.
Formula: ${
    cisSummary.formula || "Not available"
  }.

CIS Parameter Breakdown:
${Object.entries(cisSummary.parameter_breakdown || {})
  .map(([documentType, data]) => {
    return `
Document: ${documentType}
Weight: ${data.weight ?? "Not available"}.
Mu value: ${data.mu_j ?? "Not available"}.
Weighted score: ${data.weighted_score ?? "Not available"}.
Required: ${data.is_required ?? "Not available"}.
Compliance status: ${
      data.compliance_status || "Not available"
    }.
Validation result: ${JSON.stringify(
      data.validation_result || {}
    )}.
`;
  })
  .join("\n")}

Operational Recommendation:
Recommendation: ${
    cisSummary.operational_recommendation?.recommendation ||
    "Not available"
  }.
Action: ${
    cisSummary.operational_recommendation?.action ||
    "Not available"
  }.
Priority: ${
    cisSummary.operational_recommendation?.priority ||
    "Not available"
  }.
Manual review required: ${
    cisSummary.operational_recommendation?.manual_review_required ??
    "Not available"
  }.
Clearance type: ${
    cisSummary.operational_recommendation?.clearance_type ||
    "Not available"
  }.
Critical issues:
${
  cisSummary.operational_recommendation?.critical_issues
    ?.map((issue) => `- ${issue}`)
    .join("\n") || "- None"
}

Authenticity Analysis:
Overall authenticity score: ${
    authenticity.overall_authenticity_score ?? "Not available"
  }.
Authenticity verdict: ${
    authenticity.overall_verdict || "Not available"
  }.
Documents considered authentic: ${
    authenticity.is_authentic ?? "Not available"
  }.
Fake documents detected: ${
    authenticity.has_fake_documents ?? "Not available"
  }.
Verification flags:
${
  authenticity.verification_flags
    ?.map((flag) => `- ${flag}`)
    .join("\n") || "- None"
}

Per-Document Authenticity:
${Object.entries(authenticity.per_document_authenticity || {})
  .map(([documentType, data]) => {
    return `
Document: ${documentType}
Authenticity score: ${
      data.authenticity_score ?? "Not available"
    }.
Verdict: ${data.verdict || "Not available"}.
Flags: ${
      data.flags?.join(", ") || "None"
    }.
Authentic: ${data.is_authentic ?? "Not available"}.
Fake: ${data.is_fake ?? "Not available"}.
`;
  })
  .join("\n")}

Compliance Strengths:
${
  prosAndCons.overall_pros
    ?.map((pros) => `- ${pros}`)
    .join("\n") || "- None identified"
}

Compliance Weaknesses:
${
  prosAndCons.overall_cons
    ?.map((cons) => `- ${cons}`)
    .join("\n") || "- None identified"
}

Per-Document Compliance Issues:
${Object.entries(prosAndCons.per_document_breakdown || {})
  .map(([documentType, data]) => {
    return `
Document: ${documentType}

Strengths:
${
  data.pros?.map((item) => `- ${item}`).join("\n") ||
  "- None"
}

Issues:
${
  data.cons?.map((item) => `- ${item}`).join("\n") ||
  "- None"
}
`;
  })
  .join("\n")}

Deduction Analysis:
Current CIS score: ${
    botAnalysis.current_cis_score ?? "Not available"
  }.
Target clearance CIS: ${
    botAnalysis.target_clearance_cis ?? "Not available"
  }.
Clearance gap: ${
    botAnalysis.clearance_gap ?? "Not available"
  }.
Can achieve single-click clearance after remediation: ${
    botAnalysis.can_achieve_single_click ?? "Not available"
  }.
Estimated CIS after remediation: ${
    botAnalysis.estimated_cis_after_remediation ??
    "Not available"
  }.
Total deductions found: ${
    botAnalysis.total_deductions_found ?? 0
  }.

Deduction Severity:
Critical: ${
    botAnalysis.deductions_summary?.critical ?? 0
  }.
High: ${
    botAnalysis.deductions_summary?.high ?? 0
  }.
Medium and low: ${
    botAnalysis.deductions_summary?.medium_and_low ?? 0
  }.

Deduction Narrative:
${
  botAnalysis.executive_narrative ||
  "Not available"
}

Itemized Deductions:
${deductions
  .map((deduction) => {
    return `
Deduction ID: ${deduction.deduction_id || "Not available"}
Category: ${deduction.category || "Not available"}
Document type: ${
      deduction.document_type || "Not available"
    }.
Field: ${deduction.field || "Not available"}.
Severity: ${deduction.severity || "Not available"}.
Reason: ${deduction.reason || "Not available"}.
CIS score deduction: ${
      deduction.cis_score_deduction ?? "Not available"
    }.
Deduction percentage: ${
      deduction.cis_deduction_pct || "Not available"
    }.
Penalty points: ${
      deduction.penalty_points ?? "Not available"
    }.
Error code: ${
      deduction.error_code || "Not available"
    }.
Potential score recovery: ${
      deduction.potential_score_recovery ??
      "Not available"
    }.
How to fix: ${
      deduction.how_to_fix || "Not available"
    }.
Action steps:
${
  deduction.action_steps
    ?.map((step) => `- ${step}`)
    .join("\n") || "- None"
}
Acceptable formats:
${
  deduction.acceptable_formats
    ?.map((format) => `- ${format}`)
    .join("\n") || "- Not specified"
}
Priority: ${
      deduction.priority ?? "Not available"
    }.
Remediation status: ${
      deduction.remediation_status || "Not available"
    }.
`;
  })
  .join("\n")}
`.trim();

  return text;
}

module.exports = {
  parseSummary,
};