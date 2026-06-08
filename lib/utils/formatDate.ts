import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Safely parses any input into a valid Date object.
 */
function parseDateSafely(date: string | Date): Date | null {
  if (!date) return null;
  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }
  
  // Try ISO parse first
  const parsedISO = parseISO(date);
  if (isValid(parsedISO)) return parsedISO;
  
  // Fallback to standard javascript Date parse
  const directParsed = new Date(date);
  return isValid(directParsed) ? directParsed : null;
}

/**
 * Formats a date value into human legible long form: "Jun 4, 2025".
 */
export function formatDate(date: string | Date): string {
  const d = parseDateSafely(date);
  if (!d) return '-';
  return format(d, 'MMM d, yyyy');
}

/**
 * Formats a date value into human short form: "06/04/25".
 */
export function formatDateShort(date: string | Date): string {
  const d = parseDateSafely(date);
  if (!d) return '-';
  return format(d, 'MM/dd/yy');
}

/**
 * Calculates a relative duration string from the current time anchor: "2 days ago".
 */
export function formatRelative(date: string | Date): string {
  const d = parseDateSafely(date);
  if (!d) return 'unknown';
  return formatDistanceToNow(d, { addSuffix: true });
}
