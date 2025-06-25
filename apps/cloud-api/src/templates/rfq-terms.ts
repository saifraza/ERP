// Standard RFQ Terms and Conditions for Indian Manufacturing/Sugar Industry

export const standardRFQTerms = {
  commercial: {
    title: "COMMERCIAL TERMS AND CONDITIONS",
    items: [
      {
        heading: "Payment Terms",
        points: [
          "Payment shall be made within {paymentDays} days from the date of receipt of invoice",
          "Payment will be released only after satisfactory receipt and inspection of materials",
          "TDS will be deducted as per applicable rates",
          "All statutory deductions will be made as per government regulations"
        ]
      },
      {
        heading: "Price Validity",
        points: [
          "Quoted prices should be valid for minimum 90 days from the date of quotation",
          "Prices should be firm and fixed during the validity period",
          "No price escalation will be accepted after order placement",
          "Prices should be inclusive of all taxes and duties except GST which should be shown separately"
        ]
      },
      {
        heading: "Delivery Terms",
        points: [
          "Delivery basis: {deliveryTerms}",
          "Materials should be delivered within the specified time frame",
          "Delayed delivery may attract penalty as per agreement",
          "Part shipments are allowed only with prior written approval"
        ]
      },
      {
        heading: "Invoicing",
        points: [
          "Original invoice along with supporting documents must be submitted",
          "E-way bill is mandatory as per GST regulations",
          "Test certificates and quality documents must accompany the invoice",
          "Invoice should clearly mention PO number and item details"
        ]
      }
    ]
  },
  
  technical: {
    title: "TECHNICAL SPECIFICATIONS",
    items: [
      {
        heading: "Quality Standards",
        points: [
          "All materials must conform to relevant IS/BIS/ISO standards",
          "Materials should be from OEM or authorized distributors only",
          "Test certificates from NABL accredited labs are mandatory",
          "Right to reject non-conforming materials is reserved"
        ]
      },
      {
        heading: "Inspection",
        points: [
          "Materials will be subject to inspection at our premises",
          "Inspection does not absolve supplier from warranty obligations",
          "Rejected materials should be lifted within 7 days at supplier's cost",
          "Third party inspection may be arranged if deemed necessary"
        ]
      },
      {
        heading: "Warranty",
        points: [
          "Minimum warranty period: {warrantyPeriod}",
          "Warranty should cover manufacturing defects",
          "Replacement of defective items should be done within 7 days",
          "Warranty terms should be clearly mentioned in quotation"
        ]
      },
      {
        heading: "Packing & Forwarding",
        points: [
          "Materials should be properly packed to prevent damage during transit",
          "Each package should be clearly marked with item details",
          "Packing list should be attached with each consignment",
          "Moisture-sensitive items should have appropriate protection"
        ]
      }
    ]
  },
  
  submission: {
    title: "QUOTATION SUBMISSION GUIDELINES",
    items: [
      {
        heading: "Submission Requirements",
        points: [
          "Quotation must be submitted on or before the due date",
          "Late submissions will not be considered",
          "Quotation should be on vendor's letterhead with stamp and signature",
          "All pages of the quotation should be signed and stamped"
        ]
      },
      {
        heading: "Required Documents",
        points: [
          "Valid GST registration certificate",
          "PAN card copy",
          "MSME certificate (if applicable)",
          "OEM authorization letter (for distributors)",
          "Latest bank solvency certificate",
          "List of major clients with contact details"
        ]
      },
      {
        heading: "Quotation Format",
        points: [
          "Item-wise unit rates should be clearly mentioned",
          "HSN codes must be provided for all items",
          "Taxes and duties should be shown separately",
          "Total amount in figures and words",
          "Delivery schedule for each item",
          "Payment terms accepted"
        ]
      }
    ]
  },
  
  evaluation: {
    title: "EVALUATION CRITERIA",
    items: [
      {
        heading: "Technical Evaluation",
        points: [
          "Compliance with technical specifications",
          "Quality certifications and standards",
          "Past performance and references",
          "Manufacturing capacity and infrastructure"
        ]
      },
      {
        heading: "Commercial Evaluation",
        points: [
          "L1 (Lowest Price) among technically qualified vendors",
          "Total cost of ownership including taxes",
          "Payment terms offered",
          "Delivery schedule adherence capability"
        ]
      },
      {
        heading: "Vendor Assessment",
        points: [
          "Financial stability and creditworthiness",
          "Quality systems and certifications",
          "Previous supply track record",
          "After-sales service capability"
        ]
      }
    ]
  },
  
  general: {
    title: "GENERAL TERMS AND CONDITIONS",
    items: [
      {
        heading: "Legal Compliance",
        points: [
          "Vendor must comply with all applicable laws and regulations",
          "All statutory requirements including labor laws must be followed",
          "Environmental norms and safety standards must be adhered to",
          "Valid licenses and permissions must be maintained"
        ]
      },
      {
        heading: "Confidentiality",
        points: [
          "All information shared should be kept confidential",
          "Drawings and specifications should not be shared with third parties",
          "NDA may be required for sensitive items",
          "Breach of confidentiality may lead to legal action"
        ]
      },
      {
        heading: "Force Majeure",
        points: [
          "Neither party liable for delays due to force majeure events",
          "Written notice must be given within 48 hours of such event",
          "Documentary evidence of force majeure must be provided",
          "Best efforts to minimize impact must be made"
        ]
      },
      {
        heading: "Dispute Resolution",
        points: [
          "Any disputes shall be resolved through mutual discussion",
          "Arbitration as per Arbitration and Conciliation Act, 2015",
          "Jurisdiction: {jurisdiction} courts only",
          "Applicable law: Indian law"
        ]
      },
      {
        heading: "General Conditions",
        points: [
          "The company reserves the right to accept or reject any quotation without assigning reasons",
          "Quantity may vary +/- 10% at the time of actual order placement",
          "This RFQ does not constitute a commitment to purchase",
          "Partial orders may be placed based on requirements",
          "Vendor registration may be required before order placement",
          "E-invoicing is mandatory as per GST regulations"
        ]
      }
    ]
  },
  
  sugarIndustrySpecific: {
    title: "SUGAR INDUSTRY SPECIFIC TERMS",
    items: [
      {
        heading: "Seasonal Requirements",
        points: [
          "Delivery must account for crushing season urgency",
          "Spares availability during season is critical",
          "24x7 support during crushing season (October-April)",
          "Emergency delivery capability for breakdown items"
        ]
      },
      {
        heading: "Quality Requirements",
        points: [
          "Food grade materials where applicable",
          "Materials must be suitable for sugar plant environment",
          "Corrosion resistance for items in contact with juice/chemicals",
          "High temperature resistance for boiler/turbine items"
        ]
      },
      {
        heading: "Documentation",
        points: [
          "Material test certificates are mandatory",
          "Calibration certificates for instruments",
          "FDA approval for food contact items",
          "Pressure vessel certificates where applicable"
        ]
      }
    ]
  }
}

// Function to customize terms based on RFQ type
export function getCustomizedTerms(
  paymentDays: number = 30,
  deliveryTerms: string = "Ex-Works",
  warrantyPeriod: string = "12 months",
  jurisdiction: string = "District Court"
): string {
  const terms = JSON.stringify(standardRFQTerms)
    .replace(/{paymentDays}/g, paymentDays.toString())
    .replace(/{deliveryTerms}/g, deliveryTerms)
    .replace(/{warrantyPeriod}/g, warrantyPeriod)
    .replace(/{jurisdiction}/g, jurisdiction)
  
  return JSON.parse(terms)
}

// Special terms for different categories
export const categorySpecificTerms = {
  chemicals: [
    "MSDS (Material Safety Data Sheet) must be provided",
    "Proper hazard labeling as per regulations",
    "UN approved packaging for hazardous chemicals",
    "Transportation as per hazardous goods regulations"
  ],
  
  electrical: [
    "ISI mark mandatory for electrical items",
    "Test certificates from CPRI/ERDA",
    "Conformity to IE rules and standards",
    "Type test reports for switchgear items"
  ],
  
  mechanical: [
    "IBR approval for boiler mountings",
    "Hydraulic test certificates for pressure parts",
    "Dynamic balancing certificates for rotating equipment",
    "Vibration test reports where applicable"
  ],
  
  instrumentation: [
    "Calibration certificates with traceability",
    "HART/Fieldbus compatibility certificates",
    "Explosion proof certification for hazardous areas",
    "IP protection certificates"
  ],
  
  consumables: [
    "Shelf life must be clearly mentioned",
    "Manufacturing date not older than 3 months",
    "Proper storage conditions must be specified",
    "Batch-wise test certificates required"
  ]
}