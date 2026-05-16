/**
 * Safely parses an amount string or number into a clean float.
 * Handles commas, nulls, and undefined values.
 * 
 * @param amount - The amount value to parse (e.g., "1,25,000.50", 100, null)
 * @returns A clean float number, or 0 as fallback.
 */
export function parseSafeAmount(amount: string | number | null | undefined): number {
  if (amount === null || amount === undefined) return 0;
  
  if (typeof amount === "number") return amount;

  try {
    // Remove commas and other non-numeric characters except the decimal point
    const cleaned = amount.replace(/,/g, "").trim();
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error("Failed to parse amount:", amount, error);
    return 0;
  }
}
