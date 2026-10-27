import { beforeEach, expect, it, vi } from "vitest";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("#/db", () => ({ db: { query: { product: { findFirst } } } }));
vi.mock("#/server/env.server", () => ({
	env: { BETTER_AUTH_SECRET: "test-secret" },
}));
const { findProductBySlug } = await import("./product.server");
const { warehouseShipping } = await import(
	"#/features/shipping/shipping-config.server"
);

beforeEach(() => vi.resetAllMocks());

it("returns the same anonymous ID as shipping without leaking source fields", async () => {
	findFirst.mockResolvedValue({
		id: "p",
		slug: "shoe",
		name: "Shoe",
		brand: "Brand",
		description: "Product details",
		department: "men",
		category: "shoes",
		currency: "USD",
		skus: [],
		warehouse: "private-supplier.example",
		url: "https://private-supplier.example/item/1",
		internalField: "private",
	});
	const product = await findProductBySlug("shoe");
	expect(product?.storeId).toBe(
		warehouseShipping("private-supplier.example").groupId,
	);
	expect(product?.storeId).toMatch(/^[a-f0-9]{64}$/);
	expect(product).not.toHaveProperty("warehouse");
	expect(product).not.toHaveProperty("url");
	expect(product).not.toHaveProperty("internalField");
	expect(JSON.stringify(product)).not.toContain("private-supplier");
});
it("returns no product when the slug is missing", async () => {
	findFirst.mockResolvedValue(undefined);
	expect(await findProductBySlug("missing")).toBeUndefined();
});
