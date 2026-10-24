import { describe, expect, it } from "vitest";
import {
	type CatalogScope,
	catalogFiltersSchema,
	DEFAULT_FILTERS,
	effectiveSort,
	hasActiveFilters,
} from "./catalog-filters";

const listing: CatalogScope = { mode: "listing" };
const deals: CatalogScope = { mode: "deals" };

describe("catalogFiltersSchema", () => {
	it("defaults to no filters", () => {
		expect(DEFAULT_FILTERS).toEqual({
			brands: [],
			sizes: [],
			colors: [],
			sale: false,
		});
		expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
	});

	it("drops malformed values instead of failing", () => {
		const parsed = catalogFiltersSchema.parse({
			brands: "Nike",
			minPrice: "cheap",
			maxPrice: -5,
			sale: "yes",
			sort: "random",
			q: "air",
		});
		expect(parsed).toEqual({
			brands: [],
			sizes: [],
			colors: [],
			sale: false,
			q: "air",
		});
	});

	it("keeps well-formed values", () => {
		const parsed = catalogFiltersSchema.parse({
			brands: ["Nike"],
			minPrice: 5000,
			sort: "price-asc",
		});
		expect(parsed.brands).toEqual(["Nike"]);
		expect(parsed.minPrice).toBe(5000);
		expect(parsed.sort).toBe("price-asc");
		expect(hasActiveFilters(parsed)).toBe(true);
	});
});

describe("effectiveSort", () => {
	it("uses each page's natural order", () => {
		expect(effectiveSort(DEFAULT_FILTERS, listing)).toBe("name");
		expect(effectiveSort(DEFAULT_FILTERS, deals)).toBe("discount");
	});

	it("ranks a search by relevance unless told otherwise", () => {
		const searching = { ...DEFAULT_FILTERS, q: "air" };
		expect(effectiveSort(searching, listing)).toBe("relevance");
		expect(effectiveSort({ ...searching, sort: "price-asc" }, listing)).toBe(
			"price-asc",
		);
	});

	it("ignores relevance once the search is cleared", () => {
		expect(
			effectiveSort({ ...DEFAULT_FILTERS, sort: "relevance" }, listing),
		).toBe("name");
	});
});
