import { describe, expect, it } from "vitest";
import type { CartItem } from "#/features/cart/cart";
import {
	calculateQuote,
	restoreCheckoutQuote,
} from "#/features/checkout/checkout-quote.server";
import { estimateShipment, groupShipments } from "./shipping";

const pricing = {
	gelPerUsd: 2.7,
	rateDate: "2026-10-26T00:00:00Z",
	serviceFeeBps: 500,
	iban: "GE29NB0000000101904917",
};
const item = (
	id: string,
	warehouse: string,
	price: number,
	flatRateUsd = 800,
	freeFromUsd: number | null = 7500,
): CartItem => ({
	id,
	name: id,
	price,
	currency: "USD",
	quantity: 1,
	image: null,
	shipping: {
		groupId: warehouse,
		rule: { flatRateUsd, freeFromUsd },
		estimatedUnitUsd: price,
	},
});

describe("warehouse shipping", () => {
	it("does not let another warehouse's merchandise qualify a shipment for free shipping", () => {
		const quote = calculateQuote(
			[item("a", "A", 7000, 600, 5000), item("b", "B", 4000)],
			pricing,
		);
		expect(quote).toMatchObject({
			subtotalUsd: 11000,
			shippingUsd: 800,
			serviceFeeUsd: 550,
			totalUsd: 12350,
			totalGel: 33345,
		});
		expect(quote.shipments).toMatchObject([
			{ groupId: "A", shippingUsd: 0 },
			{ groupId: "B", shippingUsd: 800 },
		]);
	});
	it("combines quantities and different SKUs from the same warehouse, charging once", () => {
		const a = { ...item("a", "A", 2000), quantity: 2 };
		const b = item("b", "A", 3500);
		expect(calculateQuote([a, b], pricing).shippingUsd).toBe(0);
		expect(
			calculateQuote([a, { ...b, price: 3499 }], pricing).shippingUsd,
		).toBe(800);
		expect(calculateQuote([a, b], pricing).shipments).toHaveLength(1);
	});
	it("adds all paid shipments and supports always-free and no-threshold policies", () => {
		const quote = calculateQuote(
			[
				item("a", "A", 10000, 600, null),
				item("b", "B", 4000),
				item("c", "C", 100, 0, null),
			],
			pricing,
		);
		expect(quote.shippingUsd).toBe(1400);
	});
	it("converts each GEL unit before comparing the shipment subtotal to its threshold", () => {
		const a = {
			...item("a", "A", 2346, 800, 2814),
			currency: "GEL",
			quantity: 3,
		};
		expect(
			calculateQuote([a], { ...pricing, gelPerUsd: 2.5024 }).shippingUsd,
		).toBe(0);
	});
	it("refuses missing, inconsistent, or invalid rules instead of assuming shipping is free", () => {
		const a = item("a", "A", 1000);
		for (const bad of [
			undefined,
			{ groupId: "A", rule: null, estimatedUnitUsd: null },
			{
				groupId: "A",
				rule: { flatRateUsd: -1, freeFromUsd: null },
				estimatedUnitUsd: null,
			},
		]) {
			expect(() => calculateQuote([{ ...a, shipping: bad }], pricing)).toThrow(
				"Shipping is not available",
			);
		}
		expect(() =>
			calculateQuote([a, item("b", "A", 1000, 700)], pricing),
		).toThrow("Shipping is not available");
	});
	it("keeps grouping and cart estimates consistent after quantity changes", () => {
		const a = item("a", "A", 2500);
		expect(
			groupShipments([item("b", "B", 1000), a]).map((group) => group.groupId),
		).toEqual(["A", "B"]);
		expect(estimateShipment([a])?.shippingUsd).toBe(800);
		expect(estimateShipment([{ ...a, quantity: 3 }])?.shippingUsd).toBe(0);
		expect(
			estimateShipment([
				{
					...a,
					shipping: {
						groupId: "A",
						rule: { flatRateUsd: 800, freeFromUsd: 7500 },
						estimatedUnitUsd: null,
					},
				},
			]),
		).toBeNull();
	});
	it("preserves frozen policies and legacy totals without inventing a shipment breakdown", () => {
		const a = item("a", "A", 1000);
		const quote = calculateQuote([a], pricing);
		if (a.shipping?.rule) a.shipping.rule.flatRateUsd = 999;
		expect(restoreCheckoutQuote(quote).shipments?.[0]?.rule.flatRateUsd).toBe(
			800,
		);
		const { shipments: _shipments, ...legacy } = quote;
		legacy.lines = legacy.lines.map(({ shipping: _shipping, ...line }) => line);
		expect(restoreCheckoutQuote(legacy)).toEqual(legacy);
		expect(restoreCheckoutQuote(legacy).shipments).toBeUndefined();
	});
});
