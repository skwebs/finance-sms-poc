import { Bank, BANKS } from "../constants/banks";

export function identifyBank(address: string, body: string): Bank {
  const normalizedAddress = address.toUpperCase();
  const normalizedBody = body.toUpperCase();

  for (const bank of Object.values(BANKS)) {
    if (bank.id === Bank.UNKNOWN) continue;
    
    // Check address first (most reliable)
    if (bank.keywords.some(keyword => normalizedAddress.includes(keyword))) {
      return bank.id;
    }
    
    // Check body as fallback
    if (bank.keywords.some(keyword => normalizedBody.includes(keyword))) {
      return bank.id;
    }
  }

  return Bank.UNKNOWN;
}
