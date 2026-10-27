import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	rows: vi.fn(),
	entries: vi.fn(),
	rate: vi.fn(),
}));
vi.mock("@tanstack/react-start/server", () => ({
	getCookie: () => "00000000-0000-4000-8000-000000000001",
	setCookie: vi.fn(),
}));
vi.mock("#/db", () => ({
	db: {
		select: () => ({
			from: () => ({ innerJoin: () => ({ where: mocks.rows }) }),
		}),
	},
}));
vi.mock("#/server/redis.server", () => ({
	getRedis: async () => ({ hGetAll: mocks.entries }),
}));
vi.mock("#/features/checkout/exchange-rate.server", () => ({
	getGelPerUsd: mocks.rate,
}));
vi.mock("#/server/env.server", () => ({
	env: {
		BETTER_AUTH_SECRET: "test-secret",
		WAREHOUSE_SHIPPING_RULES:
			'{"store.example":{"flatRateUsd":800,"freeFromUsd":7500}}',
	},
}));
const { cart } = await import("./cart.server");

beforeEach(() => {
	vi.resetAllMocks();
	mocks.entries.mockResolvedValue({ a: "2", b: "1", c: "1" });
	mocks.rows.mockResolvedValue([
		{
			id: "a",
			name: "A",
			warehouse: "store.example",
			currency: "GEL",
			price: 2700,
			image: null,
		},
		{
			id: "b",
			name: "B",
			warehouse: "store.example",
			currency: "GEL",
			price: 5400,
			image: null,
		},
		{
			id: "c",
			name: "C",
			warehouse: "unknown.example",
			currency: "GEL",
			price: 8100,
			image: null,
		},
	]);
	mocks.rate.mockResolvedValue({ gelPerUsd: 2.7 });
});

it("attaches warehouse policies from the catalog and estimates using the current rate", async () => {
	const items = await cart.get();
	expect(items[0]).toMatchObject({
		quantity: 2,
		shipping: {
			rule: { flatRateUsd: 800, freeFromUsd: 7500 },
			estimatedUnitUsd: 1000,
		},
	});
	expect(items[0]?.shipping?.groupId).toBe(items[1]?.shipping?.groupId);
	expect(items[2]?.shipping?.rule).toBeNull();
	expect(items.every((line) => !("warehouse" in line))).toBe(true);
});
it("keeps the cart readable without a conversion rate and avoids rate requests during checkout locks", async () => {
	mocks.rate.mockResolvedValue(null);
	expect((await cart.get())[0]?.shipping?.estimatedUnitUsd).toBeNull();
	mocks.rate.mockClear();
	expect((await cart.getForCheckout())[0]?.shipping?.rule?.flatRateUsd).toBe(
		800,
	);
	expect(mocks.rate).not.toHaveBeenCalled();
});
it("does not need an exchange rate for a USD cart", async () => {
	mocks.entries.mockResolvedValue({ a: "1" });
	mocks.rows.mockResolvedValue([
		{
			id: "a",
			name: "A",
			warehouse: "store.example",
			currency: "USD",
			price: 5000,
			image: null,
		},
	]);
	expect((await cart.get())[0]?.shipping?.estimatedUnitUsd).toBe(5000);
	expect(mocks.rate).not.toHaveBeenCalled();
});
