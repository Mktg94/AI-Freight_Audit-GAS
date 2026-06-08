/**
 * Formats a numeric value into a localized currency string.
 * @param amount - The numerical financial value to be formatted.
 * @param currency - The currency code (e.g., USD, EUR). Defaults to 'USD'.
 * @returns A formatted currency string, e.g., "$12,550.00".
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
