// Common date formats found in SMS
export const DATE_REGEX = /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})|(\d{1,2})-(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-(\d{2,4})/i;

export function extractDate(text: string): string | null {
  const match = text.match(DATE_REGEX);
  return match ? match[0] : null;
}
