/**
 * Computes standard carrier billing discrepancy absolute difference.
 */
export function calculateDiscrepancy(billed: number, expected: number): number {
  if (billed === undefined || expected === undefined || isNaN(billed) || isNaN(expected)) {
    return 0;
  }
  return Number((billed - expected).toFixed(2));
}

/**
 * Computes savings proportion as a ratio percentage of general billed funds.
 */
export function calculateSavingsPercent(totalBilled: number, totalSavings: number): number {
  if (!totalBilled || totalBilled <= 0 || isNaN(totalBilled) || isNaN(totalSavings)) {
    return 0;
  }
  return Number(((totalSavings / totalBilled) * 100).toFixed(2));
}

/**
 * Resolves color classes depending on the scope of calculated audit savings.
 * Meets the design spec colors: Success/savings = #10B981, Danger/errors = #EF4444.
 */
export function getSavingsColor(savings: number): string {
  if (savings > 0) {
    return 'text-[#10B981]'; // Success emerald
  }
  if (savings < 0) {
    return 'text-[#EF4444]'; // Danger red
  }
  return 'text-[#94A3B8]'; // Muted secondary text
}
