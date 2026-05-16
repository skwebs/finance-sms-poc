import { TransactionType } from "./transactionMeaning";

export interface TransactionFingerprint {
  amount: string | null;
  bank: string;
  merchant: string | null;
  cardLast4: string | null;
  accountLast4: string | null;
  upiRef: string | null;
  type: TransactionType;
  date: number; // raw timestamp
}

export function generateTransactionHash(data: TransactionFingerprint): string {
  const { amount, bank, merchant, cardLast4, accountLast4, upiRef, type } = data;
  
  // Normalize data for hashing
  const normalizedAmount = amount ? parseFloat(amount).toFixed(2) : "0.00";
  const normalizedMerchant = (merchant || "unknown").toUpperCase().trim();
  const normalizedCard = cardLast4 || "";
  const normalizedAccount = accountLast4 || "";
  const normalizedUpi = upiRef || "";
  
  // Use UPI Ref as primary unique identifier if available
  if (normalizedUpi) {
    return `UPI-${normalizedUpi}`;
  }

  // Fallback hash
  return `${bank}-${type}-${normalizedAmount}-${normalizedMerchant}-${normalizedCard}-${normalizedAccount}`.replace(/\s+/g, "");
}

export function isProbableDuplicate(newTxn: TransactionFingerprint, existingTxn: TransactionFingerprint, windowMs: number = 300000): boolean {
  // 5 minutes tolerance (default)
  
  // 1. Same UPI Ref is a definite duplicate
  if (newTxn.upiRef && existingTxn.upiRef && newTxn.upiRef === existingTxn.upiRef) {
    return true;
  }

  // 2. Same amount, bank, card/account, and within time window
  const sameAmount = newTxn.amount === existingTxn.amount;
  const sameBank = newTxn.bank === existingTxn.bank;
  const sameEntity = (newTxn.cardLast4 === existingTxn.cardLast4) && (newTxn.accountLast4 === existingTxn.accountLast4);
  const withinWindow = Math.abs(newTxn.date - existingTxn.date) <= windowMs;

  if (sameAmount && sameBank && sameEntity && withinWindow) {
    return true;
  }

  return false;
}
