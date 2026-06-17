/**
 * Data minimization — only send what is needed for rate verification.
 *
 * Strips personally identifiable information (PII) from invoice and
 * contract objects before they are sent to the AI audit function.
 */
export interface AuditSafeInvoice {
  line_items: Array<{
    description: string
    billed_amount: number
    quantity: number
    unit: string
  }>
  total_billed?: number
  weight_lbs?: number | null
  distance_miles?: number | null
  freight_type?: string | null
}

export interface AuditSafeContract {
  carrier_name: string
  minimum_charge: number
  currency: string
  charge_items: Array<{
    name: string
    rate: number
    rate_type: string
  }>
  effective_date?: string
  expiry_date?: string
}

export function stripInvoicePII(invoice: any): AuditSafeInvoice {
  const lineItems = (invoice.line_items || invoice.extracted_data?.line_items || []).map(
    (li: any) => ({
      description: li.description || 'Line Item',
      billed_amount: Number(li.billed_amount) || 0,
      quantity: Number(li.quantity) || 1,
      unit: li.unit || 'unit',
    })
  )

  return {
    line_items: lineItems,
    total_billed: Number(invoice.total_billed) || undefined,
    weight_lbs: invoice.weight_lbs != null ? Number(invoice.weight_lbs) : null,
    distance_miles: invoice.distance_miles != null ? Number(invoice.distance_miles) : null,
    freight_type: invoice.freight_type || null,
  }
}

export function stripContractPII(contract: any): AuditSafeContract {
  return {
    carrier_name: contract.carrier_name || '',
    minimum_charge: Number(contract.minimum_charge) || 0,
    currency: contract.currency || 'USD',
    charge_items: (contract.charge_items || []).map((ci: any) => ({
      name: ci.name,
      rate: ci.rate,
      rate_type: ci.rate_type,
    })),
    effective_date: contract.effective_date || undefined,
    expiry_date: contract.expiry_date || undefined,
  }
}
