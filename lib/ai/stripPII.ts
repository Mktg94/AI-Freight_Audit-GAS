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
  const chargeItems = (contract.charge_items || []).map((ci: any) => ({
    name: ci.name,
    rate: ci.rate,
    rate_type: ci.rate_type,
  }));

  if (chargeItems.length === 0) {
    const legacy: AuditSafeContract['charge_items'] = [];
    if (Number(contract.base_rate_per_lb)) {
      legacy.push({ name: 'Base Freight (per lb)', rate: Number(contract.base_rate_per_lb), rate_type: 'Per lb' });
    }
    if (Number(contract.base_rate_per_mile)) {
      legacy.push({ name: 'Base Freight (per mile)', rate: Number(contract.base_rate_per_mile), rate_type: 'Per mile' });
    }
    if (Number(contract.fuel_surcharge_pct)) {
      legacy.push({ name: 'Fuel Surcharge', rate: Number(contract.fuel_surcharge_pct) * 100, rate_type: 'Percentage of base freight charge' });
    }
    if (Number(contract.residential_surcharge)) {
      legacy.push({ name: 'Residential Surcharge', rate: Number(contract.residential_surcharge), rate_type: 'Flat fee per occurrence' });
    }
    if (Number(contract.detention_rate_per_hr)) {
      legacy.push({ name: 'Detention', rate: Number(contract.detention_rate_per_hr), rate_type: 'Per hour' });
    }
    if (Number(contract.liftgate_fee)) {
      legacy.push({ name: 'Liftgate Fee', rate: Number(contract.liftgate_fee), rate_type: 'Flat fee per occurrence' });
    }
    if (Number(contract.inside_delivery_fee)) {
      legacy.push({ name: 'Inside Delivery Fee', rate: Number(contract.inside_delivery_fee), rate_type: 'Flat fee per occurrence' });
    }
    if (Number(contract.redelivery_fee)) {
      legacy.push({ name: 'Redelivery Fee', rate: Number(contract.redelivery_fee), rate_type: 'Flat fee per occurrence' });
    }
    if (legacy.length > 0) {
      return {
        carrier_name: contract.carrier_name || '',
        minimum_charge: Number(contract.minimum_charge) || 0,
        currency: contract.currency || 'USD',
        charge_items: legacy,
        effective_date: contract.effective_date || undefined,
        expiry_date: contract.expiry_date || undefined,
      };
    }
  }

  return {
    carrier_name: contract.carrier_name || '',
    minimum_charge: Number(contract.minimum_charge) || 0,
    currency: contract.currency || 'USD',
    charge_items: chargeItems,
    effective_date: contract.effective_date || undefined,
    expiry_date: contract.expiry_date || undefined,
  }
}
