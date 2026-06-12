import { describe, expect, it } from "vitest";
import { formatCurrency } from "./currency";

describe("formatCurrency", () => {
  describe("when the currency has a known symbol", () => {
    it("prefixes the symbol and groups thousands", () => {
      // # GIVEN / # WHEN
      const result = formatCurrency(5000, "USD");
      // # THEN
      expect(result).toBe("$5,000");
    });

    it("uses a disambiguated symbol for non-US dollars", () => {
      // # GIVEN / # WHEN
      const result = formatCurrency(800, "SGD");
      // # THEN
      expect(result).toBe("S$800");
    });
  });

  describe("when the currency has no known symbol", () => {
    it("falls back to a suffixed code", () => {
      // # GIVEN / # WHEN
      const result = formatCurrency(1000, "JPY");
      // # THEN
      expect(result).toBe("1,000 JPY");
    });
  });
});
