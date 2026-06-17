export type InvoiceStatus = 'pending' | 'auditing' | 'flagged' | 'approved' | 'disputed';
export type LineItemStatus = 'pending' | 'approved' | 'disputed';
export type DisputeStatus = 'draft' | 'sent' | 'resolved' | 'rejected';
export type AuditFlag = 'correct' | 'overcharged' | 'undercharged' | 'not_in_contract' | 'suspicious';

export type RateType = 
  | 'Per lb'
  | 'Per kg'
  | 'Per mile'
  | 'Per km'
  | 'Per hour'
  | 'Per CBM'
  | 'Flat fee per occurrence'
  | 'Percentage of base freight charge'
  | 'Percentage of cargo value'
  | 'Not Allowed';

export interface ChargeItem {
  name: string;
  rate: number;
  rate_type: RateType;
}

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface Contract {
  id: string;
  org_id: string;
  carrier_name: string;
  effective_date: string;
  expiry_date: string;
  minimum_charge: number;
  currency: string;
  charge_items: ChargeItem[];
  created_at: string;
}

export interface Invoice {
  id: string;
  org_id: string; // references organizations
  contract_id?: string; // references contracts, nullable if not yet set/matched
  batch_id?: string;
  source?: string;
  file_name: string;
  file_url: string;
  carrier_name: string;
  invoice_number: string;
  invoice_date: string; // date
  shipment_date: string; // date
  origin: string;
  destination: string;
  weight_lbs: number;
  distance_miles: number;
  raw_extracted_text?: string;
  extracted_data?: Record<string, any>; // jsonb
  status: InvoiceStatus;
  total_billed: number;
  total_approved: number;
  total_savings: number;
  resolved_by?: string;
  uploaded_at: string;
  audited_at?: string;
}

export interface LineItem {
  id: string;
  invoice_id: string; // references invoices
  description: string;
  billed_amount: number;
  expected_amount: number;
  discrepancy: number;
  ai_flag_reason?: string;
  confidence_score: number; // 0-1
  status: LineItemStatus;
  reviewed_by?: string; // references auth.users
  reviewed_at?: string;
  approval_reason?: string;
  approval_notes?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  invoice_id: string; // references invoices
  org_id: string; // references organizations
  carrier_name: string;
  carrier_email: string;
  dispute_letter_text: string;
  total_disputed_amount: number;
  status: DisputeStatus;
  sent_at?: string;
  resolved_at?: string;
  resolution_amount?: number;
  resolution_outcome?: string;
  resolution_notes?: string;
  resolved_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  org_id: string; // references organizations
  user_id: string; // references auth.users
  action: string;
  entity_type: string;
  entity_id: string; // UUID
  metadata?: Record<string, any>; // jsonb
  created_at: string;
}

export interface AuditResult {
  invoice_id: string;
  status: 'passed' | 'flagged';
  calculated_base_rate: number;
  calculated_fuel_surcharge: number;
  calculated_accessorial_fees: number;
  calculated_total_expected: number;
  total_discrepancy: number;
  confidence_score: number;
  reason_summary: string;
  discrepancies: Array<{
    item_description: string;
    billed: number;
    expected: number;
    difference: number;
    type: AuditFlag;
    reason: string;
  }>;
}
