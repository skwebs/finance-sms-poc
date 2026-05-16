import { Bank } from "../constants/banks";
import { MessageCategory } from "../constants/messageCategories";
import { extractAmount } from "./common/amount";
import { extractDate } from "./common/dates";
import { extractUpiRef, extractCardLast4, extractAccountLast4 } from "./common/references";
import { identifyBank } from "../utils/messageClassifier";
import { classifyMessage } from "./classifyMessage";
import { TransactionType, detectTransactionMeaning } from "../utils/transactionMeaning";

export interface ParsedSMS {
  amount: string | null;
  bank: Bank;
  categories: MessageCategory[];
  merchant: string | null;
  cardLast4: string | null;
  accountLast4: string | null;
  txnDate: string | null;
  dueDate: string | null;
  totalDue: string | null;
  minDue: string | null;
  upiRef: string | null;
  confidence: number;
  transactionType: TransactionType;
  isExpense: boolean;
}

export function parseSmsPreview(address: string, body: string): ParsedSMS {
  const bank = identifyBank(address, body);
  const categories = classifyMessage(body);
  const amount = extractAmount(body);
  const upiRef = extractUpiRef(body);
  const cardLast4 = extractCardLast4(body);
  const accountLast4 = extractAccountLast4(body);
  const txnDate = extractDate(body);
  const meaning = detectTransactionMeaning(body, address);

  // Merchant extraction logic (simplified)
  let merchant = null;
  if (body.includes("at ")) {
    const atIndex = body.indexOf("at ");
    const nextSpace = body.indexOf(" ", atIndex + 3);
    const end = nextSpace !== -1 ? nextSpace : body.length;
    merchant = body.substring(atIndex + 3, end).replace(/[.,]$/, "");
  } else if (body.includes("trf to ")) {
    const toIndex = body.indexOf("trf to ");
    const nextSpace = body.indexOf(" ", toIndex + 7);
    const end = nextSpace !== -1 ? nextSpace : body.length;
    merchant = body.substring(toIndex + 7, end).replace(/[.,]$/, "");
  } else if (body.includes("to ")) {
     const toIndex = body.indexOf("to ");
     const nextSpace = body.indexOf(" ", toIndex + 3);
     const end = nextSpace !== -1 ? nextSpace : body.length;
     merchant = body.substring(toIndex + 3, end).replace(/[.,]$/, "");
  }

  // Statement specific parsing
  let totalDue = null;
  let minDue = null;
  let dueDate = null;

  if (categories.includes(MessageCategory.STATEMENT)) {
    const totalDueMatch = body.match(/(?:TOTAL AMOUNT DUE|TOTAL DUE|INR|RS\.?)\s?(\d+(?:,\d+)*(?:\.\d+)?)/i);
    if (totalDueMatch) totalDue = totalDueMatch[1];

    const minDueMatch = body.match(/(?:MINIMUM AMOUNT DUE|MIN DUE)\s?(?:IS\s?)?(?:INR|RS\.?)\s?(\d+(?:,\d+)*(?:\.\d+)?)/i);
    if (minDueMatch) minDue = minDueMatch[1];
    
    const dueDateMatch = body.match(/(?:PAYABLE BY|DUE DATE|BY)\s?(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
    if (dueDateMatch) dueDate = dueDateMatch[1];
  }

  // Calculate confidence score (simple heuristic)
  let confidence = 0.2; // Base
  if (bank !== Bank.UNKNOWN) confidence += 0.3;
  if (amount) confidence += 0.3;
  if (categories.length > 0 && categories[0] !== MessageCategory.GENERAL) confidence += 0.2;

  return {
    amount,
    bank,
    categories,
    merchant,
    cardLast4,
    accountLast4,
    txnDate,
    dueDate,
    totalDue,
    minDue,
    upiRef,
    confidence: Math.min(confidence, 1.0),
    transactionType: meaning.type,
    isExpense: meaning.isExpense,
  };
}
