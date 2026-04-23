// Small utilities for formatting trading numbers.

/**
 * Format a balance with thousands separators and 2 decimals.
 *  1234.5    -> "1,234.50"
 *  9999      -> "9,999.00"
 *  null/NaN  -> "0.00"
 */
export function formatBalance(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "0.00";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Same but with a leading +/− and signed colour caller decides. */
export function formatSigned(value: number, decimals = 2): string {
  if (Number.isNaN(value)) return "0.00";
  const sign = value >= 0 ? "+" : "";
  return (
    sign +
    value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

/** URL of the Deriv cashier deposit page (works for both Demo & Real). */
export const DERIV_DEPOSIT_URL = "https://app.deriv.com/cashier/deposit";
