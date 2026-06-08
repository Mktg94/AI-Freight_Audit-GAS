import { Contract, Invoice, Dispute, AuditLog, LineItem } from '../types';

export const mockOrganization = {
  id: "org-101",
  name: "Atlas Global Logistics",
  owner_id: "user-alpha",
  created_at: new Date("2026-01-15T08:00:00Z").toISOString(),
};

export const initialContracts: Contract[] = [
  {
    id: "contract-fedex",
    org_id: "org-101",
    carrier_name: "FedEx Freight",
    effective_date: "2026-01-01",
    expiry_date: "2026-12-31",
    base_rate_per_lb: 0.1200,      // $0.12/lb
    base_rate_per_mile: 1.5000,    // $1.50/mile
    fuel_surcharge_pct: 0.1400,    // Max 14%
    residential_surcharge: 75.00,  // Max $75.00
    detention_rate_per_hr: 50.00,  // $50/hr
    liftgate_fee: 65.00,           // $65.00
    inside_delivery_fee: 90.00,    // $90.00
    redelivery_fee: 50.00,         // $50.00
    minimum_charge: 120.00,        // $120 min base
    custom_rules: {
      free_detention_minutes: 60,
      hazardous_material_fee: 150.00,
    },
    created_at: new Date("2026-01-01T00:00:00Z").toISOString(),
  },
  {
    id: "contract-ups",
    org_id: "org-101",
    carrier_name: "UPS Freight (TForce)",
    effective_date: "2026-01-15",
    expiry_date: "2026-11-30",
    base_rate_per_lb: 0.1400,
    base_rate_per_mile: 1.6500,
    fuel_surcharge_pct: 0.1600,    // Max 16%
    residential_surcharge: 85.00,
    detention_rate_per_hr: 60.00,
    liftgate_fee: 70.00,
    inside_delivery_fee: 100.00,
    redelivery_fee: 60.00,
    minimum_charge: 140.00,
    custom_rules: {
      free_detention_minutes: 45,
    },
    created_at: new Date("2026-01-14T09:00:00Z").toISOString(),
  },
  {
    id: "contract-dhl",
    org_id: "org-101",
    carrier_name: "DHL Express",
    effective_date: "2026-02-01",
    expiry_date: "2026-12-31",
    base_rate_per_lb: 0.1800,
    base_rate_per_mile: 1.9500,
    fuel_surcharge_pct: 0.1800,
    residential_surcharge: 95.00,
    detention_rate_per_hr: 75.00,
    liftgate_fee: 80.00,
    inside_delivery_fee: 120.00,
    redelivery_fee: 75.00,
    minimum_charge: 180.00,
    created_at: new Date("2026-02-01T08:30:00Z").toISOString(),
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: "inv-001",
    org_id: "org-101",
    contract_id: "contract-fedex",
    file_name: "FedEx_Freight_INV_987452.pdf",
    file_url: "#",
    carrier_name: "FedEx Freight",
    invoice_number: "FDX-987452",
    invoice_date: "2026-05-12",
    shipment_date: "2026-05-08",
    origin: "Memphis TN, USA",
    destination: "Dallas TX, USA",
    weight_lbs: 2200,
    distance_miles: 450,
    status: "flagged",
    total_billed: 1180.00,
    total_approved: 791.00,
    total_savings: 389.00,
    uploaded_at: new Date("2026-05-15T14:10:00Z").toISOString(),
    audited_at: new Date("2026-05-15T14:12:30Z").toISOString(),
    raw_extracted_text: "FedEx Freight Invoice. Bill To: Atlas Global Logistics. Invoice#: FDX-987452. Ship Date: 05/08/2026. Items: Base Rate LTL: $675.00. Fuel Surcharge (24%): $162.00. Extra Liftgate Accessory: $118.00. Unauthorized Residential Handing: $150.00.",
    extracted_data: {
      line_items: [
        { description: "LTL Base Rating Charge", billed: 675.00 },
        { description: "Fuel Surcharge (24.0% Overbilled)", billed: 162.00 },
        { description: "Liftgate Accessory Charge", billed: 118.00 },
        { description: "Weekend Delivery Up-charge", billed: 75.00 },
        { description: "Residential Delivery Handing Charge", billed: 150.00 }
      ]
    }
  },
  {
    id: "inv-002",
    org_id: "org-101",
    contract_id: "contract-ups",
    file_name: "UPS_Freight_LTL_341908.pdf",
    file_url: "#",
    carrier_name: "UPS Freight (TForce)",
    invoice_number: "UPS-341908",
    invoice_date: "2026-05-18",
    shipment_date: "2026-05-14",
    origin: "Chicago IL, USA",
    destination: "Atlanta GA, USA",
    weight_lbs: 1100,
    distance_miles: 710,
    status: "pending",
    total_billed: 1495.50,
    total_approved: 0,
    total_savings: 0,
    uploaded_at: new Date("2026-05-19T09:30:00Z").toISOString(),
    raw_extracted_text: "UPS LTL Freight. Invoice #: UPS-341908. Origin: Chicago, IL. Destination: Atlanta, GA. Heavy Weight Cargo: 1100 lbs. Miles: 710 mi. Billed Freight: $1171.50. Fuel Surcharge (21%): $224.00. Accessorial Detention (1.5 hrs): $100.00.",
    extracted_data: {
      line_items: [
        { description: "Freight Transport LTL Rate", billed: 1171.50 },
        { description: "Fuel Adjustment Surcharge", billed: 224.00 },
        { description: "Standard Ground Detention charge", billed: 100.00 }
      ]
    }
  },
  {
    id: "inv-003",
    org_id: "org-101",
    contract_id: "contract-fedex",
    file_name: "FedEx_Freight_INV_987499.pdf",
    file_url: "#",
    carrier_name: "FedEx Freight",
    invoice_number: "FDX-987499",
    invoice_date: "2026-05-20",
    shipment_date: "2026-05-16",
    origin: "Memphis TN, USA",
    destination: "St. Louis MO, USA",
    weight_lbs: 600,
    distance_miles: 285,
    status: "approved",
    total_billed: 432.40,
    total_approved: 432.40,
    total_savings: 0.00,
    uploaded_at: new Date("2026-05-22T10:15:00Z").toISOString(),
    audited_at: new Date("2026-05-22T10:16:11Z").toISOString(),
    raw_extracted_text: "FedEx Freight. Invoice#: FDX-987499. Weight: 600 lbs. Dist: 285 miles. Calculated Base: $360.00 (Max of ($0.12*600 = $72) or ($1.50*285 = $427.50)? Wait, actual base billed is $350. Surcharge Fuel (14.0%): $49.00. Redelivery charge: $33.40.",
    extracted_data: {
      line_items: [
        { description: "Base Freight Transport Rating", billed: 350.00 },
        { description: "Fuel Surcharge (14.0%)", billed: 49.00 },
        { description: "Standard Redelivery rate", billed: 33.40 }
      ]
    }
  },
  {
    id: "inv-004",
    org_id: "org-101",
    contract_id: "contract-dhl",
    file_name: "DHL_Express_EU_INV_8874102.pdf",
    file_url: "#",
    carrier_name: "DHL Express",
    invoice_number: "DHL-8874102",
    invoice_date: "2026-05-25",
    shipment_date: "2026-05-21",
    origin: "Cincinnati OH, USA",
    destination: "Indianapolis IN, USA",
    weight_lbs: 3500,
    distance_miles: 110,
    status: "disputed",
    total_billed: 1224.00,
    total_approved: 994.00,
    total_savings: 230.00,
    uploaded_at: new Date("2026-05-26T15:20:00Z").toISOString(),
    audited_at: new Date("2026-05-26T15:21:40Z").toISOString(),
    raw_extracted_text: "DHL Express Global Carrier. Invoice#: DHL-8874102. Rated Weight: 3500 lbs. Distance: 110 mi. Base Billing: $630.00. Fuel Premium (25%): $157.50. Inside Delivery Surcharge: $240.00. Liftgate: $196.50.",
    extracted_data: {
      line_items: [
        { description: "LTL Base Transit rating", billed: 630.00 },
        { description: "Fuel Adjustment premium (25%)", billed: 157.50 },
        { description: "Terminal Inside Delivery Charge", billed: 240.00 },
        { description: "Carrier lift-gate premium", billed: 196.50 }
      ]
    }
  }
];

export const initialLineItems: LineItem[] = [
  // FDX-987452 line items
  {
    id: "li-001",
    invoice_id: "inv-001",
    description: "LTL Base Rating Charge",
    billed_amount: 675.00,
    expected_amount: 675.00,
    discrepancy: 0.00,
    confidence_score: 0.98,
    status: "approved",
    created_at: new Date("2026-05-15T14:12:30Z").toISOString()
  },
  {
    id: "li-002",
    invoice_id: "inv-001",
    description: "Fuel Surcharge (24.0% Overbilled)",
    billed_amount: 162.00,
    expected_amount: 94.50, // 14% of 675
    discrepancy: 67.50,
    ai_flag_reason: "Billed fuel percentage (24.0%) exceeds carrier contract terms (Max 14.0%). Overcharged by $67.50.",
    confidence_score: 0.99,
    status: "disputed",
    created_at: new Date("2026-05-15T14:12:30Z").toISOString()
  },
  {
    id: "li-003",
    invoice_id: "inv-001",
    description: "Liftgate Accessory Charge",
    billed_amount: 118.00,
    expected_amount: 65.00, // contract price
    discrepancy: 53.00,
    ai_flag_reason: "Negotiated flat liftgate rate is $65.00. Carrier billed $118.00, resulting in an unauthorized rate delta of $53.00.",
    confidence_score: 0.95,
    status: "disputed",
    created_at: new Date("2026-05-15T14:12:30Z").toISOString()
  },
  {
    id: "li-004",
    invoice_id: "inv-001",
    description: "Weekend Delivery Up-charge",
    billed_amount: 75.00,
    expected_amount: 0.00,
    discrepancy: 75.00,
    ai_flag_reason: "Weekend/special transit fee is not supported by contract terms. Overcharged by $75.00.",
    confidence_score: 0.96,
    status: "disputed",
    created_at: new Date("2026-05-15T14:12:30Z").toISOString()
  },
  {
    id: "li-005",
    invoice_id: "inv-001",
    description: "Residential Delivery Handing Charge",
    billed_amount: 150.00,
    expected_amount: 75.00, // contract price
    discrepancy: 75.00,
    ai_flag_reason: "Stipulated flat residential fee in Contract specifies $75.00 limit. Carrier billed $150.00. Excess discrepancy of $75.00.",
    confidence_score: 0.99,
    status: "disputed",
    created_at: new Date("2026-05-15T14:12:30Z").toISOString()
  },
  // DHL-8874102 line items
  {
    id: "li-006",
    invoice_id: "inv-004",
    description: "LTL Base Transit rating",
    billed_amount: 630.00,
    expected_amount: 630.00,
    discrepancy: 0.00,
    confidence_score: 0.99,
    status: "approved",
    created_at: new Date("2026-05-26T15:21:40Z").toISOString()
  },
  {
    id: "li-007",
    invoice_id: "inv-004",
    description: "Fuel Adjustment premium (25%)",
    billed_amount: 157.50,
    expected_amount: 113.40, // 18% of 630
    discrepancy: 44.10,
    ai_flag_reason: "Contract schedule caps diesel fuel premium surcharging at 18.0%. Carrier tariff levied 25.0%. Overbilling of $44.10.",
    confidence_score: 0.97,
    status: "disputed",
    created_at: new Date("2026-05-26T15:21:40Z").toISOString()
  },
  {
    id: "li-008",
    invoice_id: "inv-004",
    description: "Terminal Inside Delivery Charge",
    billed_amount: 240.00,
    expected_amount: 120.00, // contract price
    discrepancy: 120.00,
    ai_flag_reason: "Inside delivery accessory rates capped at $120.00 per bill of lading. Overcharged $120.00.",
    confidence_score: 0.94,
    status: "disputed",
    created_at: new Date("2026-05-26T15:21:40Z").toISOString()
  },
  {
    id: "li-009",
    invoice_id: "inv-004",
    description: "Carrier lift-gate premium",
    billed_amount: 196.50,
    expected_amount: 80.00, // contract price
    discrepancy: 116.50,
    ai_flag_reason: "Stipulated liftgate fee capped at $80.00 under DHL terms. Carrier billed $196.50.",
    confidence_score: 0.98,
    status: "disputed",
    created_at: new Date("2026-05-26T15:21:40Z").toISOString()
  }
];

export const initialDisputes: Dispute[] = [
  {
    id: "disp-001",
    invoice_id: "inv-004",
    org_id: "org-101",
    carrier_name: "DHL Express",
    carrier_email: "billing-claims@dhl-express.com",
    dispute_letter_text: `Attention: DHL Express Billing & Logistics Audit Committee

RE: Billing Dispute for Invoice #DHL-8874102

On behalf of Atlas Global Logistics, we are submitting an official audit billing dispute for the freight invoice #DHL-8874102 (Shipment Date: May 21, 2026). Our automated audit engine has flagged several direct billing discrepancies that depart from our negotiated freight contract effective February 1, 2026.

Herewith is the itemized list of contested charges:

1. Fuel Adjustment Premium:
   - Billed: $157.50 (Calculated at 25%)
   - Agreed Contract Cap: $113.40 (18.0% Base Rate cap)
   - Overbille Delta: $44.10

2. Inside Delivery Accessory Fee:
   - Billed: $240.00
   - Negotiated Freight Contract limit: $120.00
   - Overbill Delta: $120.00

3. Liftgate Surcharge:
   - Billed: $196.50
   - Negotiated Flat Rate: $80.00
   - Overbill Delta: $116.50

Total Disputed Refunding Requested: $280.60
Adjusted Total Approved Value: $943.40 (instead of $1224.00)

We request that you review this freight claim, void the original invoice, and reissue an updated freight invoice or approve a cargo billing credit of $280.60. Please reply directly to this notice with your resolution status of claims.

Sincerely,
Atlas Global Logistics Audit Team`,
    total_disputed_amount: 280.60,
    status: "sent",
    sent_at: new Date("2026-05-27T10:00:00Z").toISOString(),
    created_at: new Date("2026-05-26T16:00:00Z").toISOString()
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: "log-001",
    org_id: "org-101",
    user_id: "user-alpha",
    action: "Contract negotiation registered",
    entity_type: "contract",
    entity_id: "contract-fedex",
    metadata: { carrier: "FedEx Freight", effective_date: "2026-01-01" },
    created_at: new Date("2026-01-01T08:00:15Z").toISOString()
  },
  {
    id: "log-002",
    org_id: "org-101",
    user_id: "user-alpha",
    action: "Contract negotiation registered",
    entity_type: "contract",
    entity_id: "contract-ups",
    metadata: { carrier: "UPS Freight (TForce)", effective_date: "2026-01-15" },
    created_at: new Date("2026-01-14T09:15:30Z").toISOString()
  },
  {
    id: "log-003",
    org_id: "org-101",
    user_id: "system",
    action: "Invoice automated audit completed",
    entity_type: "invoice",
    entity_id: "inv-001",
    metadata: { invoice_number: "FDX-987452", flags_raised: 4, detected_savings: 389.00 },
    created_at: new Date("2026-05-15T14:12:35Z").toISOString()
  },
  {
    id: "log-004",
    org_id: "org-101",
    user_id: "user-alpha",
    action: "Dispute letter generated and dispatched",
    entity_type: "dispute",
    entity_id: "disp-001",
    metadata: { invoice_number: "DHL-8874102", amount: 280.60, destination_email: "billing-claims@dhl-express.com" },
    created_at: new Date("2026-05-27T10:00:12Z").toISOString()
  }
];
