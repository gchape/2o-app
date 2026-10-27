import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getGelPerUsd: vi.fn() }));
vi.mock("#/server/env.server", () => ({ env: {} }));
vi.mock("./exchange-rate.server", () => ({
	getGelPerUsd: mocks.getGelPerUsd,
}));
const { checkoutPricing, checkoutSettings, validIban } = await import(
	"./checkout-config.server"
);
const settings = {
	CHECKOUT_IBAN: "GE29NB0000000101904917",
	CHECKOUT_SERVICE_FEE_BPS: "500",
	TELEGRAM_BOT_TOKEN: "test-token",
	TELEGRAM_CHAT_ID: "test-chat",
};
const rate = { gelPerUsd: 2.65, date: "2026-10-26T00:00:00.000Z" };

beforeEach(() => vi.resetAllMocks());

describe("checkout configuration", () => {
	it("validates IBAN checksums", () => {
		expect(validIban(settings.CHECKOUT_IBAN)).toBe(true);
		expect(validIban("GE00NB0000000101904917")).toBe(false);
	});

	it("requires complete explicit settings", () => {
		expect(checkoutSettings(settings)).toEqual({
			iban: "GE29NB0000000101904917",
			serviceFeeBps: 500,
		});
		for (const key of Object.keys(settings))
			expect(checkoutSettings({ ...settings, [key]: undefined })).toBeNull();
		expect(
			checkoutSettings({ ...settings, CHECKOUT_SERVICE_FEE_BPS: "-5" }),
		).toBeNull();
	});

	it("ignores the retired manual-rate and beneficiary variables", () => {
		expect(
			checkoutSettings({
				...settings,
				CHECKOUT_BENEFICIARY: "Someone",
				CHECKOUT_SHIPPING_USD_CENTS: "700",
				CHECKOUT_PAYMENT_CURRENCY: "GEL",
				CHECKOUT_GEL_PER_USD: "9",
				CHECKOUT_RATE_UPDATED_AT: "2020-01-01T00:00:00Z",
			}),
		).toEqual(checkoutSettings(settings));
	});
});

describe("checkout pricing", () => {
	it("combines the settings with the current NBG rate", async () => {
		mocks.getGelPerUsd.mockResolvedValue(rate);
		expect(await checkoutPricing(settings)).toEqual({
			iban: "GE29NB0000000101904917",
			serviceFeeBps: 500,
			gelPerUsd: 2.65,
			rateDate: "2026-10-26T00:00:00.000Z",
		});
	});

	it("is unavailable when the rate cannot be fetched", async () => {
		mocks.getGelPerUsd.mockResolvedValue(null);
		expect(await checkoutPricing(settings)).toBeNull();
	});

	it("does not ask NBG while settings are incomplete", async () => {
		expect(
			await checkoutPricing({ ...settings, TELEGRAM_CHAT_ID: undefined }),
		).toBeNull();
		expect(mocks.getGelPerUsd).not.toHaveBeenCalled();
	});
});
