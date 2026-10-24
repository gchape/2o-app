import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	CATALOG_PAGE_SIZE,
	catalogFiltersSchema,
	scopeSchema,
} from "./catalog-filters";
import { catalogFacets, searchCatalog } from "./catalog-search.server";

const searchInput = z.object({
	scope: scopeSchema,
	filters: catalogFiltersSchema,
	page: z.int().min(1).max(10_000).default(1),
	pageSize: z.int().min(1).max(CATALOG_PAGE_SIZE).default(CATALOG_PAGE_SIZE),
});

/** One page of a listing (a department, a category or the deals), already filtered and sorted. */
export const searchCatalogFn = createServerFn({ method: "GET" })
	.validator(searchInput)
	.handler(({ data }) =>
		searchCatalog(data.scope, data.filters, data.page, data.pageSize),
	);

/** What the filter bar offers: brands, sizes and colors with counts, and the price span. */
export const catalogFacetsFn = createServerFn({ method: "GET" })
	.validator(searchInput.pick({ scope: true, filters: true }))
	.handler(({ data }) => catalogFacets(data.scope, data.filters));

export type CatalogFacets = Awaited<ReturnType<typeof catalogFacetsFn>>;
