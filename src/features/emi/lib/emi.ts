/**
 * EMI maths — BRD §5: "Calculate EMI instantly", display total payable and
 * total interest. Acceptance criteria: "EMI is calculated accurately".
 *
 * Kept as a pure function with no React and no DOM, so it is trivially unit
 * testable and reusable by the project pages and the chatbot's EMI Assistant.
 */

export interface EmiInput {
  /** Principal in rupees. */
  principal: number;
  /** Nominal annual interest rate, as a percentage (e.g. 8.5). */
  annualRatePercent: number;
  /** Loan tenure in years. */
  tenureYears: number;
}

export interface EmiBreakdown {
  monthlyEmi: number;
  totalInterest: number;
  totalPayable: number;
  /** Interest as a share of the total payable — drives the donut chart. */
  interestShare: number;
}

/** What a fixed extra payment each month saves you. */
export interface PrepaymentSaving {
  /** Months saved off the original tenure. */
  monthsSaved: number;
  /** Interest saved, in rupees. */
  interestSaved: number;
  /** The shortened tenure, in months. */
  newTermMonths: number;
}

/**
 * Standard reducing-balance EMI:
 *
 *        P · r · (1 + r)^n
 *  EMI = ─────────────────
 *         (1 + r)^n − 1
 *
 * where r is the *monthly* rate and n the number of months.
 */
export function calculateEmi({
  principal,
  annualRatePercent,
  tenureYears,
}: EmiInput): EmiBreakdown {
  const months = Math.round(tenureYears * 12);

  if (principal <= 0 || months <= 0) {
    return { monthlyEmi: 0, totalInterest: 0, totalPayable: 0, interestShare: 0 };
  }

  const monthlyRate = annualRatePercent / 12 / 100;

  // A zero-interest loan is just the principal spread evenly; the formula above
  // divides by zero here, so it is handled explicitly.
  const monthlyEmi =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  const totalPayable = monthlyEmi * months;
  const totalInterest = totalPayable - principal;

  return {
    monthlyEmi,
    totalInterest,
    totalPayable,
    interestShare: totalPayable > 0 ? totalInterest / totalPayable : 0,
  };
}

/**
 * Simulates paying `extraPerMonth` on top of the EMI, month by month, until the
 * balance clears.
 *
 * Amortisation is simulated rather than solved algebraically because it is
 * exact, obvious to read, and at most 360 iterations — the closed form buys
 * nothing here and is far easier to get subtly wrong.
 */
export function calculatePrepaymentSaving(
  { principal, annualRatePercent, tenureYears }: EmiInput,
  extraPerMonth: number,
): PrepaymentSaving {
  const months = Math.round(tenureYears * 12);
  const base = calculateEmi({ principal, annualRatePercent, tenureYears });

  if (extraPerMonth <= 0 || principal <= 0 || months <= 0) {
    return { monthsSaved: 0, interestSaved: 0, newTermMonths: months };
  }

  const monthlyRate = annualRatePercent / 12 / 100;
  const payment = base.monthlyEmi + extraPerMonth;

  let balance = principal;
  let interestPaid = 0;
  let elapsed = 0;

  // The guard is belt-and-braces: `payment` always exceeds the interest accrual
  // because it is the EMI plus a positive amount, so this terminates.
  while (balance > 0 && elapsed < months) {
    const interest = balance * monthlyRate;
    const principalPaid = payment - interest;

    if (principalPaid <= 0) break;

    interestPaid += Math.min(interest, interest);
    balance -= principalPaid;
    elapsed += 1;
  }

  // The final month overshoots slightly; credit the overpayment back.
  if (balance < 0) balance = 0;

  return {
    monthsSaved: Math.max(0, months - elapsed),
    interestSaved: Math.max(0, base.totalInterest - interestPaid),
    newTermMonths: elapsed,
  };
}
