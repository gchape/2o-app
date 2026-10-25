import { z } from "zod";
import { categorySchema, departmentSchema } from "#/data/catalog";

/** Products per page of a listing. */
export const CATALOG_PAGE_SIZE = 48;

/** Products in the home page's drops row. */
export const HOME_DEALS_COUNT = 12;

const sorts = [
	"relevance",
	"name",
	"price-asc",
	"price-desc",
	"discount",
] as const;
export type CatalogSort = (typeof sorts)[number];

export const sortLabels = {
	relevance: "Best match",
	name: "Name",
	"price-asc": "Price: low to high",
	"price-desc": "Price: high to low",
	discount: "Biggest discount",
} satisfies Record<CatalogSort, string>;

const list = (max: number) =>
	z.array(z.string().min(1).max(60)).max(max).default([]).catch([]);

const money = z.int().min(0).max(100_000_000);

/**
 * Everything a shopper can narrow a listing by. It is also the URL's search
 * schema: malformed values fall back to "no filter" instead of erroring, so a
 * hand-edited link can never produce a broken page. Prices are minor units.
 */
export const catalogFiltersSchema = z.object({
	q: z.string().trim().max(80).optional().catch(undefined),
	brands: list(20),
	sizes: list(30),
	colors: list(20),
	minPrice: money.optional().catch(undefined),
	maxPrice: money.optional().catch(undefined),
	sale: z.boolean().default(false).catch(false),
	sort: z.enum(sorts).optional().catch(undefined),
});
export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;

export const DEFAULT_FILTERS: CatalogFilters = catalogFiltersSchema.parse({});

/** Where a listing lives: a department or category, or the deals view. */
export const scopeSchema = z.object({
	department: departmentSchema.optional(),
	category: categorySchema.optional(),
	/** "deals" shows each product at its deepest-discounted SKU. */
	mode: z.enum(["listing", "deals"]).default("listing"),
});
export type CatalogScope = z.infer<typeof scopeSchema>;

/** The sort in force: the shopper's pick, else relevance for a search, else the page's natural order. */
export const effectiveSort = (
	filters: CatalogFilters,
	scope: CatalogScope,
): CatalogSort => {
	if (filters.sort && (filters.sort !== "relevance" || filters.q)) {
		return filters.sort;
	}
	if (filters.q) return "relevance";
	return scope.mode === "deals" ? "discount" : "name";
};

export const hasActiveFilters = (f: CatalogFilters) =>
	Boolean(f.q) ||
	f.brands.length > 0 ||
	f.sizes.length > 0 ||
	f.colors.length > 0 ||
	f.minPrice != null ||
	f.maxPrice != null ||
	f.sale;
