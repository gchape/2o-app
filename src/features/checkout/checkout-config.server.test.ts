import { describe, expect, it, vi } from "vitest";

vi.mock("#/server/env.server", () => ({ env: {} }));
const { checkoutPricing, validIban } = await import("./checkout-config.server");
const now = Date.parse("2026-10-26T12:00:00Z");
const settings = {
	CHECKOUT_IBAN: "GE29NB0000000101904917",
	CHECKOUT_BENEFICIARY: "Test merchant",
	CHECKOUT_PAYMENT_CURRENCY: "USD",
	CHECKOUT_GEL_PER_USD: "2.7",
	CHECKOUT_RATE_UPDATED_AT: "2026-10-26T00:00:00Z",
	CHECKOUT_SERVICE_FEE_BPS: "500",
	CHECKOUT_SHIPPING_USD_CENTS: "700",
	TELEGRAM_BOT_TOKEN: "test-token",
	TELEGRAM_CHAT_ID: "test-chat",
};
describe("checkout configuration", () => {
	it("validates IBAN checksums", () => {
		expect(validIban(settings.CHECKOUT_IBAN)).toBe(true);
		expect(validIban("GE00NB0000000101904917")).toBe(false);
	});
	it("requires complete explicit settings and a recent rate", () => {
		expect(checkoutPricing(settings, now)).toMatchObject({
			gelPerUsd: 2.7,
			serviceFeeBps: 500,
			shippingUsd: 700,
		});
		for (const key of Object.keys(settings))
			expect(
				checkoutPricing({ ...settings, [key]: undefined }, now),
			).toBeNull();
		expect(
			checkoutPricing(
				{ ...settings, CHECKOUT_RATE_UPDATED_AT: "2026-10-01T00:00:00Z" },
				now,
			),
		).toBeNull();
		expect(
			checkoutPricing(
				{ ...settings, CHECKOUT_RATE_UPDATED_AT: "2026-11-01T00:00:00Z" },
				now,
			),
		).toBeNull();
		expect(
			checkoutPricing({ ...settings, CHECKOUT_GEL_PER_USD: "0" }, now),
		).toBeNull();
		expect(
			checkoutPricing({ ...settings, CHECKOUT_SERVICE_FEE_BPS: "-5" }, now),
		).toBeNull();
	});
});
