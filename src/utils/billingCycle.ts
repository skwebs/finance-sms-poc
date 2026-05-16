/**
 * Billing cycle utility to calculate cycle dates and due dates.
 * Billing day is the day the statement is generated.
 * Cycle: Day after billing day of previous month to billing day of current month.
 */

export interface BillingCycle {
  cycleStart: Date;
  cycleEnd: Date;
  dueDate: Date;
}

/**
 * Calculates the current billing cycle based on the billing day and grace period.
 * 
 * @param billingDay - The day of the month the statement is generated (1-31).
 * @param gracePeriod - Days after cycle end until payment is due.
 * @param referenceDate - The date to calculate from (defaults to now).
 * @returns The billing cycle details.
 */
export function calculateBillingCycle(
  billingDay: number,
  gracePeriod: number,
  referenceDate: Date = new Date()
): BillingCycle {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let cycleStart: Date;
  let cycleEnd: Date;

  // If today is past the billing day, the latest statement was generated THIS month.
  // The current unbilled cycle ends on the billing day of NEXT month.
  // If today is on or before the billing day, the latest statement was generated LAST month.
  // The current unbilled cycle ends on the billing day of THIS month.
  
  if (day > billingDay) {
    // Current unbilled cycle ends next month
    cycleStart = getSafeDate(year, month, billingDay + 1);
    cycleEnd = getSafeDate(year, month + 1, billingDay);
  } else {
    // Current unbilled cycle ends this month
    cycleStart = getSafeDate(year, month - 1, billingDay + 1);
    cycleEnd = getSafeDate(year, month, billingDay);
  }

  // Set times to cover full days
  cycleStart.setHours(0, 0, 0, 0);
  cycleEnd.setHours(23, 59, 59, 999);

  const dueDate = new Date(cycleEnd);
  dueDate.setDate(dueDate.getDate() + gracePeriod);

  return { cycleStart, cycleEnd, dueDate };
}

/**
 * Gets the latest statement date based on billing day.
 */
export function getLatestStatementDate(billingDay: number, referenceDate: Date = new Date()): Date {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let statementDate: Date;
  if (day >= billingDay) {
    statementDate = getSafeDate(year, month, billingDay);
  } else {
    statementDate = getSafeDate(year, month - 1, billingDay);
  }
  
  statementDate.setHours(23, 59, 59, 999);
  return statementDate;
}

/**
 * Handles month overflows (e.g., 31st of February).
 */
function getSafeDate(year: number, month: number, day: number): Date {
  // Date constructor handles overflows by rolling into next month
  // e.g. new Date(2023, 1, 31) becomes March 3rd.
  // We want it to be the last day of the intended month if it overflows.
  
  const date = new Date(year, month, day);
  
  // Check if month mismatch occurred (overflow)
  // We need to handle negative months or months > 11 too
  const targetDate = new Date(year, month, 1);
  const targetMonth = targetDate.getMonth();
  
  if (date.getMonth() !== targetMonth && day > 28) {
    // Rolled over, return last day of target month
    return new Date(year, month + 1, 0);
  }
  
  return date;
}
