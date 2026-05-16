export const AMOUNT_REGEX = /(?:(?:RS|INR|INR\.|RS\.)\s?|₹\s?)\s?(\d+(?:,\d+)*(?:\.\d+)?)/i;

export function extractAmount(text: string): string | null {
  const match = text.match(AMOUNT_REGEX);
  if (match && match[1]) {
    return match[1].replace(/,/g, "");
  }
  return null;
}
