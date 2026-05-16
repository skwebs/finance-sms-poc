export enum TransactionType {
  CREDIT_CARD_SPEND = "credit_card_spend",
  CREDIT_CARD_PAYMENT = "credit_card_payment",
  STATEMENT_DUE = "statement_due",
  MONEY_SENT = "money_sent",
  MONEY_RECEIVED = "money_received",
  REFUND = "refund",
  BANK_DEBIT = "bank_debit",
  BANK_CREDIT = "bank_credit",
  UNKNOWN = "unknown",
}

export interface TransactionMeaning {
  type: TransactionType;
  isExpense: boolean;
}

export function detectTransactionMeaning(body: string, address: string): TransactionMeaning {
  const normalizedBody = body.toUpperCase();
  
  // 1. Credit Card Spend
  if (
    (normalizedBody.includes("SPENT") || normalizedBody.includes("SPEND") || normalizedBody.includes("TXN OF")) &&
    (normalizedBody.includes("CARD") || normalizedBody.includes("SBICARD")) &&
    !normalizedBody.includes("RECEIVED") &&
    !normalizedBody.includes("PAYMENT OF")
  ) {
    return { type: TransactionType.CREDIT_CARD_SPEND, isExpense: true };
  }

  // 2. Credit Card Payment
  if (
    normalizedBody.includes("PAYMENT") &&
    (normalizedBody.includes("RECEIVED") || normalizedBody.includes("SUCCESSFUL") || normalizedBody.includes("CREDITED")) &&
    (normalizedBody.includes("CARD") || normalizedBody.includes("SBICARD"))
  ) {
    return { type: TransactionType.CREDIT_CARD_PAYMENT, isExpense: false };
  }

  // 3. Statement Due
  if (
    normalizedBody.includes("TOTAL AMOUNT DUE") ||
    normalizedBody.includes("MINIMUM AMOUNT DUE") ||
    normalizedBody.includes("STMT ALERT") ||
    normalizedBody.includes("STATEMENT")
  ) {
    return { type: TransactionType.STATEMENT_DUE, isExpense: false };
  }

  // 4. Money Sent / Bank Debit
  if (
    normalizedBody.includes("SENT") ||
    normalizedBody.includes("DEBITED") ||
    normalizedBody.includes("TRANSFERRED") ||
    normalizedBody.includes("TRF TO")
  ) {
    // If it mentions UPI, it's often money sent
    if (normalizedBody.includes("UPI")) {
      return { type: TransactionType.MONEY_SENT, isExpense: true };
    }
    return { type: TransactionType.BANK_DEBIT, isExpense: true };
  }

  // 5. Money Received / Bank Credit
  if (
    normalizedBody.includes("RECEIVED") ||
    normalizedBody.includes("CREDITED") ||
    normalizedBody.includes("DEPOSITED")
  ) {
    if (normalizedBody.includes("REFUND")) {
      return { type: TransactionType.REFUND, isExpense: true }; // Negative expense handled later
    }
    if (normalizedBody.includes("UPI")) {
      return { type: TransactionType.MONEY_RECEIVED, isExpense: false };
    }
    return { type: TransactionType.BANK_CREDIT, isExpense: false };
  }

  return { type: TransactionType.UNKNOWN, isExpense: false };
}
