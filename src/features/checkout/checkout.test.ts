import { describe, expect, it } from "vitest";
import type { CartItem } from "#/features/cart/cart";
import {
	type CheckoutPricing,
	calculateQuote,
	usAddressSchema,
} from "./checkout";

const pricing: CheckoutPricing = {
	gelPerUsd: 2.7,
	rateUpdatedAt: "2026-10-26T00:00:00Z",
	serviceFeeBps: 500,
	shippingUsd: 700,
	paymentCurrency: "USD",
	iban: "GE29NB0000000101904917",
	beneficiary: "Test merchant",
};
const item = (price: number, currency = "USD", quantity = 1): CartItem => ({
	id: "00000000-0000-4000-8000-000000000001",
	name: "Shoes",
	price,
	currency,
	quantity,
	image: null,
});
const address = {
	fullName: "Test Buyer",
	phone: "+1 302 555 0100",
	line1: "123 Main St",
	line2: "Room 42",
	city: "Wilmington",
	state: "DE",
	postalCode: "19804",
	country: "United States",
};

describe("checkout amounts", () => {
	it.each([
		[9899, 700],
		[9900, 0],
		[9901, 0],
	])(
		"charges shipping at a merchandise subtotal of %i cents",
		(subtotal, shipping) => {
			expect(calculateQuote([item(subtotal)], pricing).shippingUsd).toBe(
				shipping,
			);
		},
	);
	it("converts GEL, charges the fee on merchandise only and sums USD cents", () => {
		const q = calculateQuote([item(13500, "GEL")], pricing);
		expect(q).toMatchObject({
			sourceSubtotal: 13500,
			subtotalUsd: 5000,
			shippingUsd: 700,
			serviceFeeUsd: 250,
			totalUsd: 5950,
			paymentTotal: 5950,
		});
	});
	it("does not use service fee or shipping to qualify for free shipping", () => {
		const q = calculateQuote([item(9800)], pricing);
		expect(q).toMatchObject({
			shippingUsd: 700,
			serviceFeeUsd: 490,
			totalUsd: 10990,
		});
	});
	it("uses the quoted currency for the actual bank transfer", () => {
		expect(
			calculateQuote([item(10000)], { ...pricing, paymentCurrency: "GEL" })
				.paymentTotal,
		).toBe(28350);
	});
	it("preserves quantity arithmetic and all fractional cents deterministically", () => {
		const q = calculateQuote([item(1000, "GEL", 3)], pricing);
		expect(q.lines[0]).toMatchObject({ usdPrice: 370, usdTotal: 1110 });
		expect(q.subtotalUsd + q.shippingUsd + q.serviceFeeUsd).toBe(q.totalUsd);
	});
	it("rejects mixed currencies, invalid quantities, zero rates and overflowing totals", () => {
		expect(() =>
			calculateQuote([item(100, "GEL"), item(100)], pricing),
		).toThrow();
		for (const quantity of [0, -1, 11, 1.5])
			expect(() =>
				calculateQuote([item(100, "USD", quantity)], pricing),
			).toThrow();
		expect(() =>
			calculateQuote([item(100)], { ...pricing, gelPerUsd: 0 }),
		).toThrow();
		expect(() =>
			calculateQuote([item(2_000_000_000, "USD", 10)], pricing),
		).toThrow();
	});
	it("accepts U.S. addresses, normalizes the country, and rejects foreign destinations and invalid ZIPs", () => {
		expect(usAddressSchema.parse(address).country).toBe("US");
		expect(
			usAddressSchema.safeParse({ ...address, country: "Georgia" }).success,
		).toBe(false);
		expect(
			usAddressSchema.safeParse({ ...address, postalCode: "0100" }).success,
		).toBe(false);
		expect(
			usAddressSchema.safeParse({ ...address, postalCode: "19804-1234" })
				.success,
		).toBe(true);
	});
});
