import { ExtractedInvoice, ExtractedLineItem } from './extractInvoice';

const VERYFI_API_URL = 'https://api.veryfi.com/api/v8/partner/documents/';

function getAuthHeaders(): Record<string, string> {
  const clientId = process.env.VERYFI_CLIENT_ID || '';
  const apiKey = process.env.VERYFI_API_KEY || '';
  const clientSecret = process.env.VERYFI_CLIENT_SECRET || '';

  if (!clientId || !apiKey || !clientSecret) {
    throw new Error('Veryfi credentials not configured. Set VERYFI_CLIENT_ID, VERYFI_API_KEY, and VERYFI_CLIENT_SECRET.');
  }

  return {
    'Client-Id': clientId,
    'Authorization': `apikey ${apiKey}:${clientSecret}`,
    'Accept': 'application/json',
  };
}

export async function processInvoiceWithVeryfi(fileBuffer: Buffer, fileName: string): Promise<ExtractedInvoice> {
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  formData.append('file', blob, fileName);

  const response = await fetch(VERYFI_API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Veryfi API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return mapVeryfiResponse(data);
}

function mapVeryfiResponse(data: any): ExtractedInvoice {
  const lineItems: ExtractedLineItem[] = (data.line_items || []).map((item: any) => ({
    description: item.description || 'Line Item',
    billed_amount: Number(item.total) || 0,
    quantity: Number(item.quantity) || 1,
    unit: item.unit || 'unit',
  }));

  const total = lineItems.reduce((sum, item) => sum + item.billed_amount, 0);

  return {
    carrier_name: data.vendor?.name || 'Unknown Carrier',
    invoice_number: data.invoice_number || `VRFY-${Date.now()}`,
    invoice_date: data.date || null,
    shipment_date: data.delivery_date || null,
    origin: data.origin || '',
    destination: data.destination || '',
    weight_lbs: data.weight ? Number(data.weight) : null,
    distance_miles: null,
    line_items: lineItems,
    total_billed: Number(data.total) || total || 0,
  };
}
