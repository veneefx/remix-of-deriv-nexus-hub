export const VOLATILITY_MARKETS = [
  { symbol: "R_10", label: "Volatility 10 Index" },
  { symbol: "R_25", label: "Volatility 25 Index" },
  { symbol: "R_50", label: "Volatility 50 Index" },
  { symbol: "R_75", label: "Volatility 75 Index" },
  { symbol: "R_100", label: "Volatility 100 Index" },
  { symbol: "1HZ10V", label: "Volatility 10 (1s) Index" },
  { symbol: "1HZ25V", label: "Volatility 25 (1s) Index" },
  { symbol: "1HZ50V", label: "Volatility 50 (1s) Index" },
  { symbol: "1HZ75V", label: "Volatility 75 (1s) Index" },
  { symbol: "1HZ100V", label: "Volatility 100 (1s) Index" },
  { symbol: "1HZ150V", label: "Volatility 150 (1s) Index" },
  { symbol: "1HZ200V", label: "Volatility 200 (1s) Index" },
  { symbol: "1HZ250V", label: "Volatility 250 (1s) Index" },
] as const;

export const CONTRACT_TYPES = [
  { type: "DIGITOVER", label: "Over", description: "Last digit is over your prediction" },
  { type: "DIGITUNDER", label: "Under", description: "Last digit is under your prediction" },
  { type: "DIGITEVEN", label: "Even", description: "Last digit is even" },
  { type: "DIGITODD", label: "Odd", description: "Last digit is odd" },
] as const;

export const DIGIT_BARRIERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const getLastDigit = (quote: number): number => {
  const str = quote.toString();
  return parseInt(str[str.length - 1], 10);
};
