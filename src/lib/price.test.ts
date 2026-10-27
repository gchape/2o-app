import { describe, expect, it, vi } from "vitest";
import { formatPrice, formatPriceCompact, isOnSale } from "./price";

describe("formatPrice", () => {
	it("keeps the explicit English format separate from the Georgian default", () => {
		expect(formatPrice(5990, "GEL", "en")).toBe("₾59.90");
		expect(formatPrice(5990, "GEL")).toBe("59,90\u00a0₾");
	});
	it("keeps currency placement stable across runtime currency layouts", () => {
		const original = Intl.NumberFormat.prototype.formatToParts;
		const spy = vi
			.spyOn(Intl.NumberFormat.prototype, "formatToParts")
			.mockImplementation(function (this: Intl.NumberFormat, value) {
				const parts = original.call(this, value);
				return [
					...parts.filter(
						(part) => part.type !== "currency" && part.type !== "literal",
					),
					{ type: "literal", value: "\u00a0" },
					...parts.filter((part) => part.type === "currency"),
				];
			});
		try {
			expect(formatPriceCompact(4900, "GEL", "ka")).toBe("49\u00a0₾");
			expect(formatPriceCompact(4900, "GEL", "en")).toBe("₾49");
		} finally {
			spy.mockRestore();
		}
	});

	it("preserves grouping, decimal separators, and negative amounts", () => {
		expect(formatPrice(123456, "USD", "ka")).toBe("1\u00a0234,56\u00a0$");
		expect(formatPrice(123456, "USD", "en")).toBe("$1,234.56");
		expect(formatPrice(-5990, "GEL", "ka")).toBe("-59,90\u00a0₾");
		expect(formatPrice(-5990, "GEL", "en")).toBe("-₾59.90");
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
