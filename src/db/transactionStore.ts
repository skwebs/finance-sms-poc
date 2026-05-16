import { getDatabase } from "./database";
import { ParsedSMS } from "../parsers/parseSmsPreview";
import { SMS } from "../constants/sms";
import { generateTransactionHash, TransactionFingerprint } from "../utils/deduplicateTransactions";

export async function saveTransaction(sms: SMS, parsed: ParsedSMS) {
  const db = await getDatabase();
  
  const fingerprint: TransactionFingerprint = {
    amount: parsed.amount,
    bank: parsed.bank,
    merchant: parsed.merchant,
    cardLast4: parsed.cardLast4,
    accountLast4: parsed.accountLast4,
    upiRef: parsed.upiRef,
    type: parsed.transactionType,
    date: sms.date,
  };

  const hash = generateTransactionHash(fingerprint);

  try {
    await db.runAsync(
      `INSERT INTO transactions (
        sms_id, hash, raw_sms, sender, bank, category, 
        transaction_type, amount, merchant, card_last4, 
        account_last4, upi_ref, txn_date, due_date, 
        total_due, minimum_due, confidence_score, is_expense
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sms._id,
        hash,
        sms.body,
        sms.address,
        parsed.bank,
        parsed.categories.join(","),
        parsed.transactionType,
        parsed.amount ? parseFloat(parsed.amount) : null,
        parsed.merchant,
        parsed.cardLast4,
        parsed.accountLast4,
        parsed.upiRef,
        parsed.txnDate,
        parsed.dueDate,
        parsed.totalDue ? parseFloat(parsed.totalDue) : null,
        parsed.minDue ? parseFloat(parsed.minDue) : null,
        parsed.confidence,
        parsed.isExpense ? 1 : 0,
      ]
    );
    return true;
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      // Mark as duplicate in transactions if we had a way to update, 
      // but UNIQUE hash prevents insertion anyway.
      return false; 
    }
    console.error("Failed to save transaction:", error);
    throw error;
  }
}

export async function getMonthlyExpenses() {
  const db = await getDatabase();
  // Simple current month calculation for now
  const result = await db.getAllAsync<{ total: number }>(
    "SELECT SUM(amount) as total FROM transactions WHERE is_expense = 1 AND is_duplicate = 0"
  );
  return result[0]?.total || 0;
}
