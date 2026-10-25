import type { Category } from "#/data/catalog";
import type { CatalogItem } from "#/data/catalog.types";
import { compareSizes } from "#/data/sizes";
import { pageOffset } from "#/lib/pagination";
import type { CatalogDoc } from "./catalog-doc";
import type { TagField } from "./catalog-fields";
import {
	type CatalogFilters,
	type CatalogScope,
	effectiveSort,
} from "./catalog-filters";
import { ensureCatalogReady, INDEX } from "./catalog-index.server";
import {
	buildQuery,
	expandFacet,
	facetOptions,
	sortOptions,
} from "./catalog-query";
import { ft } from "./redis-ft.server";

/** Listings show the cheapest SKU; the deals scope shows the deepest-discounted one. */
const toItem =
	(mode: CatalogScope["mode"]) =>
	(doc: CatalogDoc): CatalogItem => {
		const shown = mode === "deals" && doc.deal ? doc.deal : doc;
		return {
			id: doc.id,
			slug: doc.slug,
			name: doc.name,
			brand: doc.brand ?? null,
			currency: doc.currency,
			price: shown.price,
			originalPrice: shown.originalPrice,
			imageUrl: shown.imageUrl,
			discount: doc.discount,
		};
	};

/** One page of products for a scope and its filters, with the total match count. */
export async function searchCatalog(
	scope: CatalogScope,
	filters: CatalogFilters,
	page: number,
	pageSize: number,
) {
	await ensureCatalogReady();

	const offset = pageOffset(page, pageSize);
	const { total, docs } = await ft.search<CatalogDoc>(
		INDEX,
		buildQuery(scope, filters),
		{
			sort: sortOptions(effectiveSort(filters, scope), scope),
			offset,
			limit: pageSize,
		},
	);

	return {
		items: docs.map(toItem(scope.mode)),
		total,
		hasMore: offset + docs.length < total,
	};
}

type FacetOption = { value: string; count: number };

/** The filter each facet is driven by, which its own counts must ignore. */
const FACET_FILTER = {
	brand: "brands",
	sizes: "sizes",
	colors: "colors",
} as const satisfies Partial<Record<TagField, keyof CatalogFilters>>;

async function tagFacet(
	scope: CatalogScope,
	filters: CatalogFilters,
	field: keyof typeof FACET_FILTER,
): Promise<FacetOption[]> {
	// Counts ignore their own filter, so picking one value doesn't hide the rest.
	const query = buildQuery(scope, { ...filters, [FACET_FILTER[field]]: [] });
	const rows = await ft.aggregate(INDEX, query, facetOptions(field));

	return expandFacet(rows, field, field !== "brand");
}

/**
 * Cheapest and dearest price in the results, read from both ends of the
 * unique price sort key.
 */
async function priceBounds(scope: CatalogScope, filters: CatalogFilters) {
	const query = buildQuery(scope, {
		...filters,
		minPrice: undefined,
		maxPrice: undefined,
	});
	const edge = async (sort: "price-asc" | "price-desc") => {
		const { docs } = await ft.search<CatalogDoc>(INDEX, query, {
			sort: sortOptions(sort, scope),
			offset: 0,
			limit: 1,
		});
		const doc = docs[0];
		return doc && toItem(scope.mode)(doc).price;
	};

	const [min, max] = await Promise.all([edge("price-asc"), edge("price-desc")]);
	return min != null && max != null ? { min, max } : null;
}

/** Shoe sizes are numbers and clothing sizes are letters: numbers first, each on its own scale. */
const sizeKind = (size: string): Category =>
	Number.isNaN(Number(size)) ? "clothing" : "shoes";

const compareFacetSizes = (a: FacetOption, b: FacetOption) => {
	const [kindA, kindB] = [sizeKind(a.value), sizeKind(b.value)];
	if (kindA !== kindB) return kindA === "shoes" ? -1 : 1;
	return compareSizes(kindA, a.value, b.value);
};

/** What the filter bar offers for the current scope and filters. */
export async function catalogFacets(
	scope: CatalogScope,
	filters: CatalogFilters,
) {
	await ensureCatalogReady();

	const [brands, sizes, colors, price] = await Promise.all([
		tagFacet(scope, filters, "brand"),
		tagFacet(scope, filters, "sizes"),
		tagFacet(scope, filters, "colors"),
		priceBounds(scope, filters),
	]);

	return { brands, sizes: sizes.toSorted(compareFacetSizes), colors, price };
}
