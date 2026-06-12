// Currencies offered for monetary values such as a post's "earn up to" figure.
// Kept small and curated — editors pick from this list. Deliberately not
// DB-backed: it's a handful of rarely-changing codes, and a table couldn't
// supply the display symbols the formatter will need anyway.
export const CURRENCIES = ["USD", "GBP", "EUR", "SGD", "CAD", "AUD"] as const;

export type Currency = (typeof CURRENCIES)[number];

// Display symbol for each supported currency. SGD/CAD/AUD are disambiguated
// from the bare "$" so a figure can't be mistaken for US dollars.
const SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  SGD: "S$",
  CAD: "C$",
  AUD: "A$",
};

// Formats a whole-number amount with its currency symbol, e.g. (5000, "USD")
// → "$5,000" and (800, "SGD") → "S$800". Falls back to a "1,000 XYZ" suffix
// form for any currency we don't have a symbol for.
export function formatCurrency(amount: number, currency: string): string {
  const formattedAmount = amount.toLocaleString("en-US");
  const symbol = SYMBOLS[currency];
  return symbol
    ? `${symbol}${formattedAmount}`
    : `${formattedAmount} ${currency}`;
}
