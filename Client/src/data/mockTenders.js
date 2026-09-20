/**
 * Official GeM Baseline Tenders Dataset
 * Pre-audited public procurement opportunities under GFR 2017 & PPP-MII Order.
 * When officers upload/extract new tenders, they are dynamically prepended to this list.
 */

export const mockTenders = [
  {
    id: 'GEM/2026/B/7168476',
    referenceNo: 'GEM/2026/B/7168476',
    tenderId: 'GEM/2026/B/7168476',
    title: 'Procurement of High-Capacity Enterprise Core Switches & 100G Optical Transceivers',
    department: 'Ministry of Electronics & Information Technology (MeitY)',
    ministry: 'Government of India',
    location: 'National Data Centre (NDC), New Delhi & Pune Hub',
    category: 'Computers & IT Equipment',
    documentType: 'technical_specs',
    value: '₹ 4,85,00,000 (₹ 4.85 Cr)',
    numericValue: 48500000,
    estimatedValue: 48500000,
    emdAmount: '₹ 9,70,000 (2% of Est. Value)',
    daysLeft: '21 days',
    closingDays: 21,
    published: '20 Mar 2026',
    closes: '10 Apr 2026',
    closingDate: '2026-04-10',
    submissions: 3,
    status: 'Open',
    statusType: 'active',
    sourceType: 'TENDER',
    minLocalContent: '50% (Class-I)',
    miiRequirement: 'Class-I (>= 50% Local Content)',
    eligibilityCriteria: [
      'GFR 2017 Rule 144(xi) Land Border Compliance Declaration',
      'Make in India (PPP-MII) Class-I Local Content (>= 50%)',
      'Average Annual Audited Turnover >= ₹ 1.50 Crore (Last 3 FYs)',
      'MSME / DPIIT Startup Prior Turnover & Experience Waiver under Rule 173(i)',
      'OEM Authorization Form (MAF) with 5-Year Comprehensive 24x7 SLA',
    ],
    eligibility: 'GFR 2017 Rule 144(xi) Land Border Declaration, Class-I MII (>= 50%), MSME Udyam waiver eligible',
    description: 'Turnkey supply, installation, testing and 5-year 24x7 SLA commissioning of High-Density 100G Backbone Layer-3 Core Switches with Redundant Power Supplies, GFR 144(xi) Land Border compliance, and mandatory Make in India Class-I local content.',
    documents: [
      {
        name: 'MeitY_Enterprise_Switch_RFP_2026_v2.pdf',
        size: '4.8 MB',
        url: 'https://res.cloudinary.com/sih2026-gem/image/upload/v1725700000/tenders/MeitY_Enterprise_Switch_RFP_2026_v2.pdf',
      },
    ],
    extractedRules: {
      gfr144xi: {
        status: 'Mandatory Land Border Declaration Required',
        passed: true,
        clause: 'Rule 144(xi) DPIIT Registration / Annexure-I Declaration mandatory.',
        risk: 'LOW_RISK',
      },
      miiContent: {
        status: 'Class-I Local Supplier (>= 50% Local Content)',
        percentage: 50,
        clause: 'PPP-MII Order 2017 compliant self-certificate with OEM verification required.',
        risk: 'LOW_RISK',
      },
      msmeRelaxation: {
        status: 'MSME & Startup Prior Experience Waiver Active',
        clause: 'GFR 2017 Rule 173(i) exemption applicable for valid Udyam & DPIIT startups.',
        waiverAllowed: true,
      },
      financialTurnover: {
        status: 'Min. Average Turnover: ₹ 1.50 Cr (Last 3 FYs)',
        clause: 'Audited balance sheet with CA UDIN certification required.',
      },
      pastExperience: {
        status: '3 Similar Completed Deployments in Last 5 Years',
        clause: 'Client work completion certificates with scope matching RFP.',
      },
      warrantySla: {
        status: '5 Years Comprehensive On-site 24x7 SLA',
        clause: 'OEM Authorization Form (MAF) with MTBF >= 250,000 hours.',
      },
    },
    rawOcrText: 'GOVERNMENT OF INDIA — MINISTRY OF ELECTRONICS & IT (MeitY)\nTENDER NOTICE REF: GEM/2026/B/7168476\nProcurement of Enterprise Core Backbone Switches with 48x25G SFP28 and 8x100G QSFP28 Uplinks.',
    createdAt: '2026-03-20T08:00:00.000Z',
  },
  {
    id: 'GEM/2026/B/8942103',
    referenceNo: 'GEM/2026/B/8942103',
    tenderId: 'GEM/2026/B/8942103',
    title: 'Supply and Multi-Year AMC of ICU High-Frequency Mechanical Ventilators',
    department: 'Ministry of Health and Family Welfare (MoHFW)',
    ministry: 'Government of India',
    location: 'AIIMS New Delhi, Rishikesh, and Bhopal Medical Centres',
    category: 'Medical Devices',
    documentType: 'boq_schedule',
    value: '₹ 12,50,00,000 (₹ 12.50 Cr)',
    numericValue: 125000000,
    estimatedValue: 125000000,
    emdAmount: '₹ 25,00,000 (2% of Est. Value)',
    daysLeft: '18 days',
    closingDays: 18,
    published: '18 Mar 2026',
    closes: '07 Apr 2026',
    closingDate: '2026-04-07',
    submissions: 2,
    status: 'Open',
    statusType: 'active',
    sourceType: 'TENDER',
    minLocalContent: '50% (Class-I)',
    miiRequirement: 'Class-I (>= 50% Local Content)',
    eligibilityCriteria: [
      'CDSCO Medical Device Manufacturing License & ISO 13485',
      'GFR 144(xi) Land Border Clearance for Medical Firmware',
      'Make in India Class-I (>= 50%) or Class-II (>= 20%) Local Content',
      'Average Annual Turnover >= ₹ 4.00 Crore in Medical Devices',
      '3 Years Comprehensive Warranty + 5 Years CMC (98% Uptime SLA)',
    ],
    eligibility: 'CDSCO License, GFR 144(xi) Clearance, MII Class-I (>= 50%), MSME EMD Exemption only',
    description: 'Procurement of 120 units of Advanced ICU Invasive & Non-Invasive Mechanical Ventilators with Integrated High-Flow Oxygen Therapy, CDSCO/US-FDA/CE certification, and 5-year Comprehensive Maintenance Contract (CMC).',
    documents: [
      {
        name: 'MoHFW_ICU_Ventilators_NIT_2026_Final.pdf',
        size: '6.2 MB',
        url: 'https://res.cloudinary.com/sih2026-gem/image/upload/v1725700000/tenders/MoHFW_ICU_Ventilators_NIT_2026_Final.pdf',
      },
    ],
    extractedRules: {
      gfr144xi: {
        status: 'Mandatory Annexure-B Land Border Clearance',
        passed: true,
        clause: 'National Security screening for imported medical controller firmware.',
        risk: 'LOW_RISK',
      },
      miiContent: {
        status: 'Class-I / Class-II Supplier (>= 50% or >= 20%)',
        percentage: 50,
        clause: 'Indigenously assembled respiratory flow sensors and display chassis.',
        risk: 'LOW_RISK',
      },
      msmeRelaxation: {
        status: 'MSME EMD Exemption Only (Quality Standards Non-Relaxable)',
        clause: 'Medical patient safety standards cannot be compromised under GFR 173(i).',
        waiverAllowed: false,
      },
      financialTurnover: {
        status: 'Min. Average Turnover: ₹ 4.00 Cr',
        clause: 'Audited CA statement and positive net worth for all 3 years.',
      },
      pastExperience: {
        status: '2 Contracts of >= 40 Ventilator Units Installed',
        clause: 'Satisfactory performance report from Hospital Biomedical Superintendent.',
      },
      warrantySla: {
        status: '3 Years Warranty + 5 Years CMC (98% Uptime SLA)',
        clause: 'Max 4-hour breakdown response time with loaner unit backup.',
      },
    },
    rawOcrText: 'MINISTRY OF HEALTH AND FAMILY WELFARE — AIIMS PROCUREMENT CELL\nGLOBAL TENDER ENQUIRY REF: GEM/2026/B/8942103',
    createdAt: '2026-03-18T10:00:00.000Z',
  },
  {
    id: 'GEM/2026/B/5519804',
    referenceNo: 'GEM/2026/B/5519804',
    tenderId: 'GEM/2026/B/5519804',
    title: 'Engineering, Procurement & Commissioning (EPC) of 50MW Ground-Mounted Solar PV Substation',
    department: 'Ministry of New and Renewable Energy (MNRE)',
    ministry: 'Government of India',
    location: 'Bhadla Solar Park, Jodhpur District, Rajasthan',
    category: 'Renewable Energy',
    documentType: 'other',
    value: '₹ 64,80,00,000 (₹ 64.80 Cr)',
    numericValue: 648000000,
    estimatedValue: 648000000,
    emdAmount: '₹ 1,29,60,000 (2% of Est. Value)',
    daysLeft: '30 days',
    closingDays: 30,
    published: '15 Mar 2026',
    closes: '15 Apr 2026',
    closingDate: '2026-04-15',
    submissions: 5,
    status: 'Open',
    statusType: 'active',
    sourceType: 'TENDER',
    minLocalContent: '60% (Class-I)',
    miiRequirement: 'Class-I (>= 60% Local Content)',
    eligibilityCriteria: [
      'ALMM Approved Mono-PERC Bifacial Solar PV Modules',
      'MNRE Approved Grid Tie Inverters & CEA Grid Code Compliance',
      'Average Annual Turnover >= ₹ 20.00 Crore in last 3 FYs',
      'Experience executing minimum 25MW Grid-Connected Solar EPC Project',
      '10-Year Operation & Maintenance (O&M) Comprehensive SLA',
    ],
    eligibility: 'ALMM Approved Modules, CEA Grid Code, Min. 60% MII Content, EPC experience >= 25MW',
    description: 'Turnkey EPC contract for 50MW (AC) Grid-Connected Solar Photovoltaic Power Plant including 132kV Pooling Substation, ALMM Approved Mono-PERC Bifacial Solar PV Modules, SCADA telemetry, and 10-year Operation & Maintenance (O&M).',
    documents: [
      {
        name: 'MNRE_Solar_EPC_50MW_NIT_2026.pdf',
        size: '9.4 MB',
        url: 'https://res.cloudinary.com/sih2026-gem/image/upload/v1725700000/tenders/MNRE_Solar_EPC_50MW_NIT_2026.pdf',
      },
    ],
    extractedRules: {
      gfr144xi: {
        status: 'ALMM & Land Border Declaration Mandatory',
        passed: true,
        clause: 'Solar cells & modules sourced strictly from ALMM List-I published by MNRE.',
        risk: 'LOW_RISK',
      },
      miiContent: {
        status: 'Class-I Local Supplier (>= 60% Local Content)',
        percentage: 60,
        clause: 'Indigenous solar module assembly and domestic structure fabrication required.',
        risk: 'LOW_RISK',
      },
      msmeRelaxation: {
        status: 'MSME EMD Exemption Active (Prior Technical Experience Non-Relaxable)',
        clause: 'Grid safety & high-voltage power substation work requires proven past track record.',
        waiverAllowed: false,
      },
      financialTurnover: {
        status: 'Min. Average Turnover: ₹ 20.00 Cr',
        clause: 'Audited net worth >= ₹ 10.00 Cr with working capital solvency certificate.',
      },
      pastExperience: {
        status: '1 Completed Solar EPC of >= 25MW or 2 of >= 15MW',
        clause: 'State Nodal Agency or SECI/NTPC project commissioning certificate.',
      },
      warrantySla: {
        status: '25-Year Solar PV Module Performance Warranty + 10-Year O&M',
        clause: 'Minimum 90% power generation at 10 years, 80% at 25 years.',
      },
    },
    rawOcrText: 'MINISTRY OF NEW AND RENEWABLE ENERGY (MNRE)\nSOLAR ENERGY CORPORATION OF INDIA — NIT REF: GEM/2026/B/5519804',
    createdAt: '2026-03-15T09:00:00.000Z',
  },
  {
    id: 'GEM/2026/B/3391042',
    referenceNo: 'GEM/2026/B/3391042',
    tenderId: 'GEM/2026/B/3391042',
    title: 'Procurement of Tactical Surveillance Quadcopter Drones & Micro-UAVs',
    department: 'Ministry of Home Affairs (MHA) / BSF Procurement Cell',
    ministry: 'Government of India',
    location: 'Border Security Posts, Western & Eastern Sectors',
    category: 'Drones & Aerospace',
    documentType: 'technical_specs',
    value: '₹ 8,20,00,000 (₹ 8.20 Cr)',
    numericValue: 82000000,
    estimatedValue: 82000000,
    emdAmount: '₹ 16,40,000 (2% of Est. Value)',
    daysLeft: '14 days',
    closingDays: 14,
    published: '16 Mar 2026',
    closes: '04 Apr 2026',
    closingDate: '2026-04-04',
    submissions: 4,
    status: 'Open',
    statusType: 'active',
    sourceType: 'TENDER',
    minLocalContent: '50% (Class-I)',
    miiRequirement: 'Class-I (>= 50% Local Content)',
    eligibilityCriteria: [
      'DGCA Type Certificate for Micro/Small Drone Category',
      'GFR 144(xi) Strict Land Border & Remote ID Encryption Compliance',
      'Make in India (PPP-MII) Class-I Local Content (>= 50%)',
      'Operating temperature -20°C to +55°C with Thermal IR Gimbal Payload',
      '3 Years Comprehensive On-site OEM Warranty & Spares Support',
    ],
    eligibility: 'DGCA Type Certified, Encrypted C2 Link, GFR 144(xi) Verified, Class-I MII (>= 50%)',
    description: 'Procurement of 60 Tactical Micro-UAV Surveillance Drones with EO/IR Night Vision Payload, Encrypted C2 Data Link, Anti-Jamming GNSS, and 55-minute endurance for border area monitoring.',
    documents: [
      {
        name: 'MHA_BSF_Tactical_Drone_RFP_2026.pdf',
        size: '5.1 MB',
        url: 'https://res.cloudinary.com/sih2026-gem/image/upload/v1725700000/tenders/MHA_BSF_Tactical_Drone_RFP_2026.pdf',
      },
    ],
    extractedRules: {
      gfr144xi: {
        status: 'Strict Land Border Flight Controller Screening',
        passed: true,
        clause: 'Drone firmware and GPS telemetry must not communicate with unauthorized servers.',
        risk: 'LOW_RISK',
      },
      miiContent: {
        status: 'Class-I Local Supplier (>= 50% Local Content)',
        percentage: 50,
        clause: 'Indigenous carbon-fiber airframe, motor propulsion, and autopilot assembly.',
        risk: 'LOW_RISK',
      },
      msmeRelaxation: {
        status: 'MSME & DPIIT Drone Startup Prior Experience Waiver Active',
        clause: 'DPIIT recognized Drone Startups eligible for exemption under GFR Rule 173(i).',
        waiverAllowed: true,
      },
      financialTurnover: {
        status: 'Min. Average Turnover: ₹ 2.50 Cr (Relaxable for Startups)',
        clause: 'Audited CA turnover certificate or DPIIT Startup Recognition Certificate.',
      },
      pastExperience: {
        status: '2 Completed Deployments to Defence, Paramilitary, or Police Forces',
        clause: 'Trial demonstration and performance report from user trials.',
      },
      warrantySla: {
        status: '3 Years Comprehensive Warranty including Batteries & Payloads',
        clause: 'Guaranteed 48-hour replacement turnaround for critical sub-assemblies.',
      },
    },
    rawOcrText: 'GOVERNMENT OF INDIA — MINISTRY OF HOME AFFAIRS\nBORDER SECURITY FORCE — PROCUREMENT TENDER REF: GEM/2026/B/3391042',
    createdAt: '2026-03-16T11:00:00.000Z',
  },
  {
    id: 'GEM/2026/B/4412098',
    referenceNo: 'GEM/2026/B/4412098',
    tenderId: 'GEM/2026/B/4412098',
    title: 'AI-Powered Automated Threat Intelligence & Next-Gen Cyber SOC Infrastructure',
    department: 'National Informatics Centre (NIC) / MeitY',
    ministry: 'Government of India',
    location: 'National Cyber Security Centre, New Delhi',
    category: 'Cyber Security Services',
    documentType: 'technical_specs',
    value: '₹ 14,50,00,000 (₹ 14.50 Cr)',
    numericValue: 145000000,
    estimatedValue: 145000000,
    emdAmount: '₹ 29,00,000 (2% of Est. Value)',
    daysLeft: '25 days',
    closingDays: 25,
    published: '19 Mar 2026',
    closes: '14 Apr 2026',
    closingDate: '2026-04-14',
    submissions: 3,
    status: 'Open',
    statusType: 'active',
    sourceType: 'TENDER',
    minLocalContent: '50% (Class-I)',
    miiRequirement: 'Class-I (>= 50% Local Content)',
    eligibilityCriteria: [
      'CERT-In Empanelled Information Security Auditing Organization',
      'ISO 27001 & SOC-2 Type-II Certified Security Operations Centre',
      'GFR 144(xi) Land Border Compliance with 100% Indian Data Residency',
      'Make in India Class-I (>= 50%) Local Software & Service Content',
      '24x7 L1/L2/L3 Incident Response Team with 15-Minute Critical SLA',
    ],
    eligibility: 'CERT-In Empanelled, ISO 27001 Certified, 100% Indian Data Residency, Class-I MII',
    description: 'Design, deployment, and 3-year 24x7 management of Next-Generation Security Operations Centre (SOC) with Automated SIEM/SOAR, AI-Driven Threat Hunting, and GFR 144(xi) compliant data sovereignty.',
    documents: [
      {
        name: 'NIC_NextGen_CyberSOC_RFP_2026.pdf',
        size: '7.8 MB',
        url: 'https://res.cloudinary.com/sih2026-gem/image/upload/v1725700000/tenders/NIC_NextGen_CyberSOC_RFP_2026.pdf',
      },
    ],
    extractedRules: {
      gfr144xi: {
        status: '100% Sovereign Data Residency & Land Border Compliance',
        passed: true,
        clause: 'All threat telemetry and SIEM log data stored within India in MeitY empanelled cloud.',
        risk: 'LOW_RISK',
      },
      miiContent: {
        status: 'Class-I Local Supplier (>= 50% Local Content)',
        percentage: 50,
        clause: 'Indigenous security analysts and indigenously hosted threat intelligence feeds.',
        risk: 'LOW_RISK',
      },
      msmeRelaxation: {
        status: 'MSME EMD Exemption Active (CERT-In Empanellment Non-Relaxable)',
        clause: 'National cyber defense standards require active CERT-In empanelment.',
        waiverAllowed: false,
      },
      financialTurnover: {
        status: 'Min. Average Turnover: ₹ 5.00 Cr in Cyber Security Services',
        clause: 'Audited CA turnover certificate for last 3 financial years.',
      },
      pastExperience: {
        status: 'Managed minimum 2 Enterprise SOCs of >= 5,000 Endpoints for Central/State Govt',
        clause: 'Client performance appreciation letters and SLA adherence reports.',
      },
      warrantySla: {
        status: '3 Years 24x7x365 Managed SOC with 99.99% Uptime SLA',
        clause: 'Max 15-minute response time for Severity-1 Cyber Security Incidents.',
      },
    },
    rawOcrText: 'NATIONAL INFORMATICS CENTRE (NIC) — MINISTRY OF ELECTRONICS & IT\nTENDER NOTICE REF: GEM/2026/B/4412098',
    createdAt: '2026-03-19T07:30:00.000Z',
  },
];

export const getTenderById = (id) => {
  if (!id) return null;
  const cleanId = String(id).trim().toLowerCase();
  return (
    mockTenders.find((t) => {
      const tId = String(t.id).toLowerCase();
      const tRef = String(t.referenceNo).toLowerCase();
      const tTdrId = String(t.tenderId).toLowerCase();
      return (
        tId === cleanId ||
        tRef === cleanId ||
        tTdrId === cleanId ||
        (cleanId.length > 3 && (tRef.includes(cleanId) || cleanId.includes(tRef)))
      );
    }) || null
  );
};

export const filterTenders = (category = 'All', status = 'All') => {
  return mockTenders.filter((t) => {
    const matchesCat = category === 'All' || t.category === category;
    const matchesStatus = status === 'All' || t.status === status;
    return matchesCat && matchesStatus;
  });
};

export default mockTenders;
