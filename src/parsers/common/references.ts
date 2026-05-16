export const UPI_REF_REGEX = /UPI\s?(?:REF|REFERENCE)?(?:\s?NO)?[:\-\s]?\s?(\d{12})/i;
export const CARD_LAST4_REGEX = /(?:CARD|ENDING WITH|ENDING IN)\s?(?:WITH\s?)?(?:XX|XXXX)?(\d{4})/i;
export const ACCOUNT_LAST4_REGEX = /(?:A\/C|ACCNT|ACCOUNT|AC)\s?(?:NO\.)?\s?(?:X+|X)?(\d{3,4})/i;

export function extractUpiRef(text: string): string | null {
  const match = text.match(UPI_REF_REGEX);
  return match ? match[1] : null;
}

export function extractCardLast4(text: string): string | null {
  const match = text.match(CARD_LAST4_REGEX);
  return match ? match[1] : null;
}

export function extractAccountLast4(text: string): string | null {
  const match = text.match(ACCOUNT_LAST4_REGEX);
  return match ? match[1] : null;
}
