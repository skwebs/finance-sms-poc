import { MessageCategory, CATEGORIES } from "../constants/messageCategories";

export function classifyMessage(body: string): MessageCategory[] {
  const normalizedBody = body.toUpperCase();
  const matchedCategories: MessageCategory[] = [];

  // Check each category
  if (CATEGORIES[MessageCategory.STATEMENT].keywords.some(kw => normalizedBody.includes(kw))) {
    matchedCategories.push(MessageCategory.STATEMENT);
  }

  if (CATEGORIES[MessageCategory.CREDIT_CARD].keywords.some(kw => normalizedBody.includes(kw))) {
    matchedCategories.push(MessageCategory.CREDIT_CARD);
  }

  if (CATEGORIES[MessageCategory.BANK].keywords.some(kw => normalizedBody.includes(kw))) {
    matchedCategories.push(MessageCategory.BANK);
  }

  if (CATEGORIES[MessageCategory.UPI].keywords.some(kw => normalizedBody.includes(kw))) {
    matchedCategories.push(MessageCategory.UPI);
  }

  if (matchedCategories.length === 0) {
    matchedCategories.push(MessageCategory.GENERAL);
  }

  return matchedCategories;
}
