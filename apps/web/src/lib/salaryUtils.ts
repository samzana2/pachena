/**
 * Formats a salary amount for display
 */
export function formatSalaryAmount(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Interface for compensation data from reviews
 */
export interface ReviewCompensation {
  role_level: string | null;
  base_salary_amount: number | null;
  base_salary_currency: string | null;
  is_net_salary: boolean | null;
  allowances_amount: number | null;
  allowances_currency: string | null;
  bonus_amount: number | null;
  bonus_currency: string | null;
  salary_range: string | null;
  secondary_salary_amount?: number | null;
  secondary_salary_currency?: string | null;
}

/**
 * Formats compensation data for display
 */
export function formatCompensationDisplay(comp: ReviewCompensation): {
  hasData: boolean;
  baseSalary: string | null;
  secondarySalary: string | null;
  allowances: string | null;
  bonus: string | null;
  salaryRange: string | null;
  netGrossLabel: string;
} {
  const hasNumericSalary = comp.base_salary_amount !== null && comp.base_salary_amount > 0;
  const hasSalaryRange = comp.salary_range !== null && comp.salary_range.trim() !== "";

  return {
    hasData: hasNumericSalary || hasSalaryRange,
    baseSalary: hasNumericSalary
      ? formatSalaryAmount(comp.base_salary_amount!, comp.base_salary_currency || "USD")
      : null,
    secondarySalary: comp.secondary_salary_amount && comp.secondary_salary_amount > 0
      ? formatSalaryAmount(comp.secondary_salary_amount, comp.secondary_salary_currency || "ZWL")
      : null,
    allowances: comp.allowances_amount && comp.allowances_amount > 0
      ? formatSalaryAmount(comp.allowances_amount, comp.allowances_currency || "USD")
      : null,
    bonus: comp.bonus_amount && comp.bonus_amount > 0
      ? formatSalaryAmount(comp.bonus_amount, comp.bonus_currency || "USD")
      : null,
    salaryRange: hasSalaryRange ? comp.salary_range : null,
    netGrossLabel: "net",
  };
}

/**
 * Keys whose values are annual amounts and need to be divided by 12 for monthly totals
 */
export const ANNUAL_BENEFIT_KEYS = new Set(["performance_bonus_annual_value"]);

/**
 * Input shape for total compensation calculation.
 */
export interface TotalCompInput {
  base_salary_amount?: number | null;
  benefit_values?: Record<string, number> | null;
  allowances_amount?: number | null;
  bonus_amount?: number | null;
  thirteenth_cheque_annual_value?: number | null;
  commission_amount?: number | null;
}

/**
 * Computes total monthly compensation for a single submission.
 */
export function getTotalComp(comp: TotalCompInput): number {
  let total = comp.base_salary_amount || 0;

  if (comp.benefit_values) {
    Object.entries(comp.benefit_values).forEach(([key, val]) => {
      if (val && val > 0) {
        total += ANNUAL_BENEFIT_KEYS.has(key) ? val / 12 : val;
      }
    });
  }

  if (comp.allowances_amount && comp.allowances_amount > 0) {
    total += comp.allowances_amount;
  }
  if (comp.bonus_amount && comp.bonus_amount > 0) {
    total += comp.bonus_amount / 12;
  }

  if (comp.thirteenth_cheque_annual_value && comp.thirteenth_cheque_annual_value > 0) {
    total += comp.thirteenth_cheque_annual_value / 12;
  }

  if (comp.commission_amount && comp.commission_amount > 0) {
    total += comp.commission_amount;
  }

  return total;
}
