// Currencies offered for monetary values such as a post's "earn up to" figure.
// Kept small and curated — editors pick from this list. Deliberately not
// DB-backed: it's a handful of rarely-changing codes, and a table couldn't
// supply the display symbols the formatter will need anyway.
export const CURRENCIES = ["USD", "GBP", "EUR", "SGD", "CAD", "AUD"] as const;

export type Currency = (typeof CURRENCIES)[number];
