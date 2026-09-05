//converting ml returned object as rag friendly text

function parseSummary(summary) {
    if (!summary || typeof summary !== "object") {
      throw new Error("Valid ML summary object is required");
    }
  
    const text = `
  Bidder compliance analysis.
  
  Overall compliance score: ${summary.overall_compliance_score}.
  Bidder is ${summary.is_valid ? "valid" : "invalid"}.
  
  Forensic check:
  ELA tampering detected: ${
      summary.forensic_check?.ela_tampering_detected
    }.
  Tampering confidence: ${
      summary.forensic_check?.confidence
        ? `${summary.forensic_check.confidence * 100}%`
        : "Not available"
    }.
  Flagged region: ${
      summary.forensic_check?.flagged_region || "None"
    }.
  
  Extraction check:
  GSTIN regex passed: ${
      summary.extraction_check?.gstin_regex_passed
    }.
  PAN regex passed: ${
      summary.extraction_check?.pan_regex_passed
    }.
  Signature present: ${
      summary.extraction_check?.signature_present
    }.
  
  Logical rules:
  Turnover meets tender minimum: ${
      summary.logical_rules?.turnover_meets_tender_min
    }.
  Reason: ${
      summary.logical_rules?.reason || "No reason provided"
    }.
  `.trim();
  
    return text;
  }
  
  module.exports = {
    parseSummary,
  };