export interface SMS {
  _id: string;
  address: string;
  body: string;
  date: number;
  read: number;
  type: number;
  thread_id: number;
}

export type SMSFilter = "all" | "bank";

export const BANK_KEYWORDS = [
  "SBI",
  "HDFC",
  "ICICI",
  "AXIS",
  "KOTAK",
  "PNB",
  "IDFC",
  "YESBANK",
  "AIRTELPAY",
  "PAYTM",
  "UPI",
  "DEBITED",
  "CREDITED",
  "TRANSFERRED",
  "BALANCE",
  "AVBL BAL",
  "A/C",
  "ACCNT",
  "TXN",
];
