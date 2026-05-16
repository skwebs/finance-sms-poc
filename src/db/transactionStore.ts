import { getDatabase } from "./database";
import { ParsedSMS } from "../parsers/parseSmsPreview";
import { SMS } from "../constants/sms";
import { generateTransactionHash, TransactionFingerprint } from "../utils/deduplicateTransactions";
import { TransactionType } from "../utils/transactionMeaning";
import { parseSafeAmount } from "../utils/amountParser";

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
      `INSERT OR IGNORE INTO transactions (
        sms_id, hash, raw_sms, sender, bank, category, 
        transaction_type, amount, merchant, card_last4, 
        account_last4, upi_ref, txn_date, due_date, 
        total_due, minimum_due, confidence_score, is_expense, txn_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sms._id,
        hash,
        sms.body,
        sms.address,
        parsed.bank,
        parsed.categories.join(","),
        parsed.transactionType,
        parseSafeAmount(parsed.amount),
        parsed.merchant,
        parsed.cardLast4,
        parsed.accountLast4,
        parsed.upiRef,
        parsed.txnDate,
        parsed.dueDate,
        parseSafeAmount(parsed.totalDue),
        parseSafeAmount(parsed.minDue),
        parsed.confidence,
        parsed.isExpense ? 1 : 0,
        sms.date,
      ]
    );
    return true;
  } catch (error: any) {
    console.error("Failed to save transaction:", error);
    throw error;
  }
}

export async function batchSaveTransactions(messages: SMS[]) {
  if (!messages || messages.length === 0) return;
  
  const db = await getDatabase();
  
  // Use a transaction for consistency and speed
  await db.withTransactionAsync(async () => {
    for (const sms of messages) {
      // Need to parse each one here or pass pre-parsed data
      const { parseSmsPreview } = require("../parsers/parseSmsPreview");
      const parsed = parseSmsPreview(sms.address, sms.body);
      
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

      await db.runAsync(
        `INSERT OR IGNORE INTO transactions (
          sms_id, hash, raw_sms, sender, bank, category, 
          transaction_type, amount, merchant, card_last4, 
          account_last4, upi_ref, txn_date, due_date, 
          total_due, minimum_due, confidence_score, is_expense, txn_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sms._id,
          hash,
          sms.body,
          sms.address,
          parsed.bank,
          parsed.categories.join(","),
          parsed.transactionType,
          parseSafeAmount(parsed.amount),
          parsed.merchant,
          parsed.cardLast4,
          parsed.accountLast4,
          parsed.upiRef,
          parsed.txnDate,
          parsed.dueDate,
          parseSafeAmount(parsed.totalDue),
          parseSafeAmount(parsed.minDue),
          parsed.confidence,
          parsed.isExpense ? 1 : 0,
          sms.date,
        ]
      );
    }
  });
}

export interface CardBillSummary {
  bank: string;
  cardLast4: string;
  totalDue: number;
  minDue: number;
  dueDate: string | null;
  paidAmount: number;
  status: 'paid' | 'partially_paid' | 'unpaid';
  statementDate: number;
}

export interface CardExpenseSummary {
  bank: string;
  cardLast4: string;
  currentCycleSpend: number;
  cycleStart: number;
  cycleEnd: number;
  transactionCount: number;
}

export async function getCardBillSummaries(): Promise<CardBillSummary[]> {
  const db = await getDatabase();
  
  // 1. Get latest statement for each card
  const statements = await db.getAllAsync<{
    bank: string;
    card_last4: string;
    total_due: number;
    minimum_due: number;
    due_date: string;
    txn_timestamp: number;
  }>(
    `SELECT bank, card_last4, total_due, minimum_due, due_date, txn_timestamp
     FROM transactions 
     WHERE transaction_type = 'statement_due' AND card_last4 IS NOT NULL
     GROUP BY bank, card_last4
     HAVING txn_timestamp = MAX(txn_timestamp)`
  );

  const summaries: CardBillSummary[] = [];

  for (const stmt of statements) {
    // 2. Get payments for this card since the statement was issued
    const payments = await db.getAllAsync<{ amount: number }>(
      `SELECT amount FROM transactions 
       WHERE transaction_type = 'credit_card_payment' 
       AND bank = ? AND card_last4 = ? 
       AND txn_timestamp >= ?`,
      [stmt.bank, stmt.card_last4, stmt.txn_timestamp]
    );

    const paidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalDue = stmt.total_due || 0;
    
    let status: 'paid' | 'partially_paid' | 'unpaid' = 'unpaid';
    if (paidAmount >= totalDue && totalDue > 0) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partially_paid';
    }

    summaries.push({
      bank: stmt.bank,
      cardLast4: stmt.card_last4,
      totalDue,
      minDue: stmt.minimum_due || 0,
      dueDate: stmt.due_date,
      paidAmount,
      status,
      statementDate: stmt.txn_timestamp,
    });
  }

  return summaries;
}

export async function getUnlinkedPayments() {
  const db = await getDatabase();
  return await db.getAllAsync<{ amount: number, bank: string, txn_timestamp: number }>(
    `SELECT amount, bank, txn_timestamp FROM transactions 
     WHERE transaction_type = 'credit_card_payment' AND card_last4 IS NULL`
  );
}

export async function getMonthlyExpenses() {
  const db = await getDatabase();
  
  // Get current month start/end
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  
  const result = await db.getAllAsync<{ amount: number, type: string }>(
    `SELECT amount, transaction_type as type FROM transactions 
     WHERE is_duplicate = 0 AND txn_timestamp >= ?`,
    [startOfMonth]
  );

  let total = 0;
  result.forEach(row => {
    if (row.type === TransactionType.CREDIT_CARD_SPEND || row.type === TransactionType.MONEY_SENT || row.type === TransactionType.BANK_DEBIT) {
      total += row.amount || 0;
    } else if (row.type === TransactionType.REFUND) {
      total -= row.amount || 0;
    }
  });
  
  return total;
}

export async function getCardSettings(bank: string, cardLast4: string): Promise<CardSettings | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ statement_day: number, grace_period: number }>(
    `SELECT statement_day, grace_period FROM cards WHERE bank = ? AND card_last4 = ?`,
    [bank, cardLast4]
  );
  if (result) {
    return { billingDay: result.statement_day, gracePeriod: result.grace_period };
  }
  return null;
}

export async function saveCardSettings(bank: string, cardLast4: string, settings: CardSettings) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO cards (bank, card_last4, statement_day, grace_period) 
     VALUES (?, ?, ?, ?)
     ON CONFLICT(bank, card_last4) DO UPDATE SET 
     statement_day = excluded.statement_day,
     grace_period = excluded.grace_period`,
    [bank, cardLast4, settings.billingDay, settings.gracePeriod]
  );
}

export async function getOutstandingBillTotal(): Promise<number> {
  const bills = await getCardBillSummaries();
  return bills.reduce((sum, bill) => {
    const outstanding = Math.max(0, bill.totalDue - bill.paidAmount);
    return sum + outstanding;
  }, 0);
}

export interface CardSettings {
  billingDay: number;
  gracePeriod: number;
}
