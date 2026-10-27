import { expect, it, vi } from "vitest";

vi.mock("#/server/env.server", () => ({
	env: {
		BETTER_AUTH_SECRET: "test-only-secret",
		WAREHOUSE_SHIPPING_RULES:
			'{"store.example":{"flatRateUsd":800,"freeFromUsd":7500}}',
	},
}));
const { parseShippingRules, warehouseShipping } = await import(
	"./shipping-config.server"
);

it("requires explicit integer USD cents and an explicit threshold or null", () => {
	for (const value of [
		undefined,
		"",
		"invalid",
		"{}",
		'{"store.example":{"flatRateUsd":800}}',
		'{"store.example":{"flatRateUsd":-1,"freeFromUsd":null}}',
		'{"store.example":{"flatRateUsd":1.5,"freeFromUsd":null}}',
		'{"https://store.example":{"flatRateUsd":800,"freeFromUsd":null}}',
	])
		expect(parseShippingRules(value)).toBeNull();
	expect(
		parseShippingRules(
			'{"store.example":{"flatRateUsd":0,"freeFromUsd":null}}',
		),
	).toEqual({ "store.example": { flatRateUsd: 0, freeFromUsd: null } });
});
it("matches exact catalog domains and returns stable opaque groups with no default rate", () => {
	expect(warehouseShipping("store.example").rule).toEqual({
		flatRateUsd: 800,
		freeFromUsd: 7500,
	});
	expect(warehouseShipping("other.example").rule).toBeNull();
	expect(warehouseShipping("store.example").groupId).toBe(
		warehouseShipping("store.example").groupId,
	);
	expect(warehouseShipping("store.example").groupId).not.toContain(
		"store.example",
	);
	expect(warehouseShipping("other.example").groupId).not.toBe(
		warehouseShipping("store.example").groupId,
	);
});
