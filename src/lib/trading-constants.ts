// ── Market Categories (ordered like Deriv DTrader) ────────────────

export interface MarketItem {
  symbol: string;
  label: string;
}

export interface MarketCategory {
  category: string;
  markets: MarketItem[];
}

// Original volatility markets stay on top (first added)
export const MARKET_CATEGORIES: MarketCategory[] = [
  {
    category: "Volatility Indices",
    markets: [
      { symbol: "R_10", label: "Volatility 10 Index" },
      { symbol: "R_25", label: "Volatility 25 Index" },
      { symbol: "R_50", label: "Volatility 50 Index" },
      { symbol: "R_75", label: "Volatility 75 Index" },
      { symbol: "R_100", label: "Volatility 100 Index" },
    ],
  },
  {
    category: "Volatility Indices (1s)",
    markets: [
      { symbol: "1HZ10V", label: "Volatility 10 (1s) Index" },
      { symbol: "1HZ25V", label: "Volatility 25 (1s) Index" },
      { symbol: "1HZ50V", label: "Volatility 50 (1s) Index" },
      { symbol: "1HZ75V", label: "Volatility 75 (1s) Index" },
      { symbol: "1HZ100V", label: "Volatility 100 (1s) Index" },
      { symbol: "1HZ150V", label: "Volatility 150 (1s) Index" },
      { symbol: "1HZ200V", label: "Volatility 200 (1s) Index" },
      { symbol: "1HZ250V", label: "Volatility 250 (1s) Index" },
    ],
  },
  {
    category: "Crash/Boom Indices",
    markets: [
      { symbol: "BOOM300N", label: "Boom 300 Index" },
      { symbol: "BOOM500", label: "Boom 500 Index" },
      { symbol: "BOOM600N", label: "Boom 600 Index" },
      { symbol: "BOOM900N", label: "Boom 900 Index" },
      { symbol: "BOOM1000", label: "Boom 1000 Index" },
      { symbol: "CRASH300N", label: "Crash 300 Index" },
      { symbol: "CRASH500", label: "Crash 500 Index" },
      { symbol: "CRASH600N", label: "Crash 600 Index" },
      { symbol: "CRASH900N", label: "Crash 900 Index" },
      { symbol: "CRASH1000", label: "Crash 1000 Index" },
    ],
  },
  {
    category: "Jump Indices",
    markets: [
      { symbol: "JD10", label: "Jump 10 Index" },
      { symbol: "JD25", label: "Jump 25 Index" },
      { symbol: "JD50", label: "Jump 50 Index" },
      { symbol: "JD75", label: "Jump 75 Index" },
      { symbol: "JD100", label: "Jump 100 Index" },
    ],
  },
  {
    category: "Step Indices",
    markets: [
      { symbol: "stpRNG", label: "Step Index" },
      { symbol: "STPRNG2", label: "Step Index 200" },
      { symbol: "STPRNG3", label: "Step Index 300" },
      { symbol: "STPRNG4", label: "Step Index 400" },
      { symbol: "STPRNG5", label: "Step Index 500" },
    ],
  },
  {
    category: "Range Break Indices",
    markets: [
      { symbol: "RDBULL", label: "Range Break 100" },
      { symbol: "RDBEAR", label: "Range Break 200" },
    ],
  },
  {
    category: "Drift Switch Indices",
    markets: [
      { symbol: "DSI10", label: "Drift Switch Index 10" },
      { symbol: "DSI20", label: "Drift Switch Index 20" },
      { symbol: "DSI30", label: "Drift Switch Index 30" },
    ],
  },
  {
    category: "DEX Indices",
    markets: [
      { symbol: "DEX600DN", label: "DEX 600 Down" },
      { symbol: "DEX600UP", label: "DEX 600 Up" },
      { symbol: "DEX900DN", label: "DEX 900 Down" },
      { symbol: "DEX900UP", label: "DEX 900 Up" },
      { symbol: "DEX1500DN", label: "DEX 1500 Down" },
      { symbol: "DEX1500UP", label: "DEX 1500 Up" },
    ],
  },
];

// Flat list for backward compatibility — preserves original order (first-added on top)
export const VOLATILITY_MARKETS = MARKET_CATEGORIES.flatMap(c => c.markets);

// Helper to find label by symbol
export const getMarketLabel = (symbol: string): string =>
  VOLATILITY_MARKETS.find(m => m.symbol === symbol)?.label || symbol;

export const CONTRACT_TYPES = [
  { type: "DIGITOVER", label: "Over", description: "Last digit is over your prediction" },
  { type: "DIGITUNDER", label: "Under", description: "Last digit is under your prediction" },
  { type: "DIGITEVEN", label: "Even", description: "Last digit is even" },
  { type: "DIGITODD", label: "Odd", description: "Last digit is odd" },
  { type: "CALL", label: "Rise", description: "Price rises at end of contract" },
  { type: "PUT", label: "Fall", description: "Price falls at end of contract" },
] as const;

export const DIGIT_BARRIERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const getLastDigit = (quote: number): number => {
  // Use toFixed(2) to preserve trailing zeros (e.g. 9602.50 → "0" not "5")
  // Volatility indices use 2 decimal places
  const formatted = Number(quote).toFixed(2);
  return parseInt(formatted[formatted.length - 1], 10);
};
