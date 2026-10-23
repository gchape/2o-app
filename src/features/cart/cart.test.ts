import { describe, expect, it } from "vitest";
import type { CartItem } from "./cart";
import {
	applyLineChange,
	EMPTY_CART,
	hasCurrencyConflict,
	summarizeCart,
} from "./cart";

const item = (overrides: Partial<CartItem>): CartItem => ({
	id: "sku",
	name: "Shoe",
	price: 1000,
	currency: "GEL",
	image: null,
	quantity: 1,
	...overrides,
});

describe("summarizeCart", () => {
	it("totals quantities and line prices", () => {
		const summary = summarizeCart([
			item({ price: 1000, quantity: 2 }),
			item({ id: "b", price: 250, quantity: 3 }),
		]);
		expect(summary.count).toBe(5);
		expect(summary.subtotal).toBe(2750);
		expect(summary.currency).toBe("GEL");
	});

	it("is empty (in the default currency) for a new cart", () => {
		expect(EMPTY_CART).toMatchObject({
			count: 0,
			subtotal: 0,
			currency: "GEL",
		});
	});
});

describe("hasCurrencyConflict", () => {
	it("accepts an empty cart and matching currencies", () => {
		expect(hasCurrencyConflict([], "USD")).toBe(false);
		expect(hasCurrencyConflict([item({})], "GEL")).toBe(false);
	});

	it("flags a line in another currency", () => {
		expect(hasCurrencyConflict([item({})], "USD")).toBe(true);
	});
});

describe("applyLineChange", () => {
	const items = [item({ id: "a", quantity: 2 }), item({ id: "b" })];

	it("sets the quantity of one line without touching the input", () => {
		const next = applyLineChange(items, { sku: "a", quantity: 5 });
		expect(next.map((i) => i.quantity)).toEqual([5, 1]);
		expect(items[0]?.quantity).toBe(2);
	});

	it("removes a line at quantity 0", () => {
		expect(
			applyLineChange(items, { sku: "a", quantity: 0 }).map((i) => i.id),
		).toEqual(["b"]);
	});

	it("ignores unknown SKUs", () => {
		expect(applyLineChange(items, { sku: "zzz", quantity: 3 })).toEqual(items);
	});
});
