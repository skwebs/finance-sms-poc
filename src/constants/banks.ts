export enum Bank {
  SBI = "SBI",
  HDFC = "HDFC",
  ICICI = "ICICI",
  AXIS = "AXIS",
  KOTAK = "KOTAK",
  PNB = "PNB",
  INDUSIND = "INDUSIND",
  UJJIVAN = "UJJIVAN",
  IDFC = "IDFC",
  YES_BANK = "YES BANK",
  AIRTEL_PAYMENTS_BANK = "AIRTEL PAYMENTS BANK",
  PAYTM = "PAYTM",
  SLICE = "SLICE",
  CBoI = "CBoI",
  UNKNOWN = "GEN",
}

export interface BankConfig {
  id: Bank;
  displayName: string;
  keywords: string[];
  color: string;
}

export const BANKS: Record<Bank, BankConfig> = {
  [Bank.SBI]: {
    id: Bank.SBI,
    displayName: "SBI",
    keywords: ["SBI", "SBICARD"],
    color: "#285DAA",
  },
  [Bank.HDFC]: {
    id: Bank.HDFC,
    displayName: "HDFC",
    keywords: ["HDFC"],
    color: "#004C8F",
  },
  [Bank.ICICI]: {
    id: Bank.ICICI,
    displayName: "ICICI",
    keywords: ["ICICI"],
    color: "#F27020",
  },
  [Bank.AXIS]: {
    id: Bank.AXIS,
    displayName: "AXIS",
    keywords: ["AXIS"],
    color: "#97144D",
  },
  [Bank.KOTAK]: {
    id: Bank.KOTAK,
    displayName: "KOTAK",
    keywords: ["KOTAK"],
    color: "#EE1C25",
  },
  [Bank.PNB]: {
    id: Bank.PNB,
    displayName: "PNB",
    keywords: ["PNB"],
    color: "#A2192F",
  },
  [Bank.INDUSIND]: {
    id: Bank.INDUSIND,
    displayName: "INDUSIND",
    keywords: ["INDUSIND"],
    color: "#6D2322",
  },
  [Bank.UJJIVAN]: {
    id: Bank.UJJIVAN,
    displayName: "UJJIVAN",
    keywords: ["UJJIVAN"],
    color: "#009DA9",
  },
  [Bank.IDFC]: {
    id: Bank.IDFC,
    displayName: "IDFC",
    keywords: ["IDFC"],
    color: "#991B1E",
  },
  [Bank.YES_BANK]: {
    id: Bank.YES_BANK,
    displayName: "YES BANK",
    keywords: ["YESBANK"],
    color: "#005EB8",
  },
  [Bank.AIRTEL_PAYMENTS_BANK]: {
    id: Bank.AIRTEL_PAYMENTS_BANK,
    displayName: "AIRTEL PAYMENTS BANK",
    keywords: ["AIRTELPAY"],
    color: "#E11900",
  },
  [Bank.PAYTM]: {
    id: Bank.PAYTM,
    displayName: "PAYTM",
    keywords: ["PAYTM"],
    color: "#00BAF2",
  },
  [Bank.SLICE]: {
    id: Bank.SLICE,
    displayName: "SLICE",
    keywords: ["SLICE"],
    color: "#C2A2FF",
  },
  [Bank.CBoI]: {
    id: Bank.CBoI,
    displayName: "CBoI",
    keywords: ["CBoI", "CENTRAL BANK"],
    color: "#FFCC00",
  },
  [Bank.UNKNOWN]: {
    id: Bank.UNKNOWN,
    displayName: "GEN",
    keywords: [],
    color: "#8E8E93",
  },
};
