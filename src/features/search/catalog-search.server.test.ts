import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCatalogDocs } from "./catalog-doc";
import { DEFAULT_FILTERS } from "./catalog-filters";
import { catalogFacets, searchCatalog } from "./catalog-search.server";

const ft = vi.hoisted(() => ({ search: vi.fn(), aggregate: vi.fn() }));
vi.mock("./redis-ft.server", () => ({ ft }));
vi.mock("./catalog-index.server", () => ({
	INDEX: "test",
	ensureCatalogReady: vi.fn(),
}));

const docs = buildCatalogDocs([
	{
		id: "product",
		storeId: "a".repeat(64),
		slug: "product",
		name: "Product",
		brand: null,
		department: "men",
		category: "shoes",
		currency: "GEL",
		skus: [
			{
				color: "black",
				size: "40",
				price: 5000,
				originalPrice: null,
				discount: 0,
				imageUrl: null,
			},
			{
				color: "white",
				size: "41",
				price: 8000,
				originalPrice: 16000,
				discount: 50,
				imageUrl: null,
			},
		],
	},
]);

beforeEach(() => {
	vi.clearAllMocks();
	ft.search.mockResolvedValue({ total: 1, docs });
	ft.aggregate.mockResolvedValue([]);
});

describe("catalog prices", () => {
	it.each([
		["listing", 5000, "sortPrice"],
		["deals", 8000, "sortDealPrice"],
	] as const)(
		"keeps %s cards, sorting, and price bounds consistent",
		async (mode, price, sortField) => {
			const scope = { mode };
			const result = await searchCatalog(
				scope,
				{ ...DEFAULT_FILTERS, sort: "price-asc" },
				1,
				48,
			);
			expect(result.items[0]?.price).toBe(price);
			expect(ft.search).toHaveBeenLastCalledWith(
				"test",
				expect.any(String),
				expect.objectContaining({ sort: { BY: sortField, DIRECTION: "ASC" } }),
			);

			const facets = await catalogFacets(scope, DEFAULT_FILTERS);
			expect(facets.price).toEqual({ min: price, max: price });
			expect(ft.search).toHaveBeenLastCalledWith(
				"test",
				expect.any(String),
				expect.objectContaining({ sort: { BY: sortField, DIRECTION: "DESC" } }),
			);
		},
	);
});

it("retains the anonymous store restriction in results and every facet query", async () => {
	const storeId = "a".repeat(64);
	const scope = { mode: "listing" as const, storeId };
	const result = await searchCatalog(scope, DEFAULT_FILTERS, 1, 48);
	expect(result.items[0]?.storeId).toBe(storeId);
	expect(result.items[0]).not.toHaveProperty("warehouse");
	await catalogFacets(scope, {
		...DEFAULT_FILTERS,
		brands: ["Nike"],
		minPrice: 5000,
	});
	for (const call of [...ft.search.mock.calls, ...ft.aggregate.mock.calls]) {
		expect(call[1]).toContain(`@store:{${storeId}}`);
	}
});
