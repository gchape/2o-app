import { describe, expect, it } from "vitest";
import { formatPrice, formatPriceCompact, isOnSale } from "./price";

describe("formatPrice", () => {
	it("keeps the explicit English format separate from the Georgian default", () => {
		expect(formatPrice(5990, "GEL", "en")).toBe("₾59.90");
		expect(formatPrice(5990, "GEL")).toBe("59,90\u00a0₾");
	});
	it("formats minor units with the narrow currency symbol", () => {
		expect(formatPrice(5990, "GEL")).toBe("59,90\u00a0₾");
		expect(formatPrice(5900)).toBe("59,00\u00a0₾");
	});
});

describe("formatPriceCompact", () => {
	it("drops decimals only for whole amounts", () => {
		expect(formatPriceCompact(5900, "GEL")).toBe("59\u00a0₾");
		expect(formatPriceCompact(5990, "GEL")).toBe("59,90\u00a0₾");
	});

	it("uses the given currency", () => {
		expect(formatPriceCompact(1000, "USD")).toBe("10\u00a0$");
	});
});

describe("isOnSale", () => {
	it("needs an original price above the current one", () => {
		expect(isOnSale(100, 150)).toBe(true);
		expect(isOnSale(100, 100)).toBe(false);
		expect(isOnSale(100, null)).toBe(false);
	});
});
