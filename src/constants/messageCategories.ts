export enum MessageCategory {
  CREDIT_CARD = "Credit Card",
  BANK = "Bank",
  UPI = "UPI",
  STATEMENT = "Statement",
  GENERAL = "General",
}

export interface CategoryConfig {
  id: MessageCategory;
  displayName: string;
  color: string;
  keywords: string[];
}

export const CATEGORIES: Record<MessageCategory, CategoryConfig> = {
  [MessageCategory.CREDIT_CARD]: {
    id: MessageCategory.CREDIT_CARD,
    displayName: "Credit Card",
    color: "#5856D6",
    keywords: ["CARD", "SBICARD", "CREDIT CARD", "XX", "XXXX"],
  },
  [MessageCategory.BANK]: {
    id: MessageCategory.BANK,
    displayName: "Bank",
    color: "#007AFF",
    keywords: ["A/C", "ACCNT", "ACCOUNT", "DEBITED", "CREDITED", "TRANSFERRED", "IMPS", "NEFT", "RTGS"],
  },
  [MessageCategory.UPI]: {
    id: MessageCategory.UPI,
    displayName: "UPI",
    color: "#34C759",
    keywords: ["UPI", "PHONEPE", "CRED CLUB", "PAYTM", "BHARATPE", "REF"],
  },
  [MessageCategory.STATEMENT]: {
    id: MessageCategory.STATEMENT,
    displayName: "Statement",
    color: "#FF9500",
    keywords: ["STMT", "STATEMENT", "MINIMUM DUE", "TOTAL DUE", "PAYABLE BY", "DUE DATE"],
  },
  [MessageCategory.GENERAL]: {
    id: MessageCategory.GENERAL,
    displayName: "General",
    color: "#8E8E93",
    keywords: [],
  },
};
