export interface SplitInvoiceItem {
  index: number;
  startPage: number;
  endPage: number;
  text: string;
  vendor?: string;
  estimatedTotal?: number;
}

export function detectMultipleInvoices(text: string, pageCount: number): boolean {
  if (pageCount <= 1) return false;
  
  // Heuristic: More than 1 "invoice" keyword mentions, or any multi-page PDF
  const matches = text.match(/(?:invoice|inv)(?:\s+#|#|\s+number|number|:|\s+no)/gi) || [];
  return matches.length > 1 || pageCount >= 3;
}

export function splitMultiInvoicePDF(text: string, pageCount: number, pagesText?: string[]): SplitInvoiceItem[] {
  const items: SplitInvoiceItem[] = [];
  const srcPages = pagesText && pagesText.length > 0 ? pagesText : text.split('\u000C'); // \u000C is the form feed character for pages in pdf-parse
  
  if (srcPages.length <= 1) {
    items.push({
      index: 1,
      startPage: 1,
      endPage: pageCount || 1,
      text: text,
      vendor: detectVendorHeuristic(text),
      estimatedTotal: extractPriceHeuristic(text)
    });
    return items;
  }

  // Iterate over pages and group them
  let currentGroupText = "";
  let groupStart = 1;

  for (let i = 0; i < srcPages.length; i++) {
    const pageTxt = srcPages[i];
    if (!pageTxt.trim()) continue;

    // Detect if this page contains start of a new invoice
    const hasNewInvoiceIndicator = pageTxt.toLowerCase().includes("invoice") || pageTxt.toLowerCase().includes("bill to") || pageTxt.toLowerCase().includes("bol #");
    
    if (hasNewInvoiceIndicator && currentGroupText.trim() !== "") {
      // commit previous
      items.push({
        index: items.length + 1,
        startPage: groupStart,
        endPage: i,
        text: currentGroupText.trim(),
        vendor: detectVendorHeuristic(currentGroupText),
        estimatedTotal: extractPriceHeuristic(currentGroupText)
      });
      currentGroupText = pageTxt;
      groupStart = i + 1;
    } else {
      currentGroupText += "\n" + pageTxt;
    }
  }

  // commit final
  if (currentGroupText.trim() !== "") {
    items.push({
      index: items.length + 1,
      startPage: groupStart,
      endPage: srcPages.length,
      text: currentGroupText.trim(),
      vendor: detectVendorHeuristic(currentGroupText),
      estimatedTotal: extractPriceHeuristic(currentGroupText)
    });
  }

  // Fallback if splitting didn't yield anything
  if (items.length === 0) {
    items.push({
      index: 1,
      startPage: 1,
      endPage: pageCount || 1,
      text: text,
      vendor: detectVendorHeuristic(text),
      estimatedTotal: extractPriceHeuristic(text)
    });
  }

  return items;
}

function extractPriceHeuristic(txt: string): number | undefined {
  const matches = txt.match(/(?:total|amount|due|billed)(?::|\s+)\$?([0-9]+(?:\.[0-9]{2})?)/i);
  if (matches) {
    const val = parseFloat(matches[1]);
    if (val > 0) return val;
  }
  return undefined; 
}

function detectVendorHeuristic(txt: string): string {
  const lowerTxt = txt.toLowerCase();
  if (lowerTxt.includes("ups") || lowerTxt.includes("united parcel service")) return "UPS Freight";
  if (lowerTxt.includes("fedex") || lowerTxt.includes("federal express")) return "FedEx Freight";
  if (lowerTxt.includes("xpo") || lowerTxt.includes("con-way")) return "XPO Logistics";
  if (lowerTxt.includes("dhl")) return "DHL Freight";
  if (lowerTxt.includes("old dominion") || lowerTxt.includes("odfl")) return "Old Dominion Freight Line";
  if (lowerTxt.includes("yrc") || lowerTxt.includes("yellow")) return "Yellow Freight";
  return "Unknown Carrier";
}
