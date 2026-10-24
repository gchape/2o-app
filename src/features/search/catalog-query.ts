import type { TagField } from "./catalog-fields";
import type {
	CatalogFilters,
	CatalogScope,
	CatalogSort,
} from "./catalog-filters";

/** TAG values need punctuation and spaces escaped: "New Balance" becomes New\ Balance. */
export const escapeTag = (value: string) =>
	value.replace(/[^\p{L}\p{N}_]/gu, (char) => `\\${char}`);

const tag = (field: TagField, values: readonly string[]) =>
	values.length > 0 ? `@${field}:{${values.map(escapeTag).join(" | ")}}` : "";

/**
 * Shopper text becomes prefix terms ("nik air" matches Nike Air). Input is
 * reduced to letters and digits first, so it can never inject query syntax.
 * One-letter terms are dropped: prefix queries need at least two characters.
 * Each term is its own `@q:term*` clause, because a parenthesised group is
 * rejected; adjacent clauses are ANDed.
 */
export function textClause(q: string | undefined) {
	const terms = (q ?? "")
		.toLowerCase()
		.split(/[^\p{L}\p{N}]+/u)
		.filter((term) => term.length >= 2)
		.slice(0, 8);

	return terms.map((term) => `@q:${term}*`).join(" ");
}

/** The FT.SEARCH query for a scope and its filters. Clauses are ANDed by juxtaposition. */
export function buildQuery(scope: CatalogScope, filters: CatalogFilters) {
	const clauses = [
		scope.department && tag("department", [scope.department]),
		scope.category && tag("category", [scope.category]),
		textClause(filters.q),
		tag("brand", filters.brands),
		tag("sizes", filters.sizes),
		tag("colors", filters.colors),
		filters.minPrice != null || filters.maxPrice != null
			? `@price:[${filters.minPrice ?? "-inf"} ${filters.maxPrice ?? "+inf"}]`
			: "",
		filters.sale || scope.mode === "deals" ? "@discount:[1 +inf]" : "",
	].filter(Boolean);

	return clauses.length > 0 ? clauses.join(" ") : "*";
}

const SORT_CLAUSES = {
	relevance: [],
	name: ["SORTBY", "sortName", "ASC"],
	"price-asc": ["SORTBY", "sortPrice", "ASC"],
	"price-desc": ["SORTBY", "sortPrice", "DESC"],
	discount: ["SORTBY", "sortDiscount", "DESC"],
} satisfies Record<CatalogSort, string[]>;

export const sortClause = (sort: CatalogSort): string[] => SORT_CLAUSES[sort];

/** FT.AGGREGATE pipeline counting products per value of a TAG field. */
export const facetPipeline = (field: TagField) => [
	"LOAD",
	"1",
	`@${field}`,
	"GROUPBY",
	"1",
	`@${field}`,
	"REDUCE",
	"COUNT",
	"0",
	"AS",
	"count",
	"SORTBY",
	"2",
	"@count",
	"DESC",
	"LIMIT",
	"0",
	"1000",
];

/**
 * Turns facet rows into `{ value, count }` options. Multi-value TAG fields may
 * come back joined ("40,41") or one value per row; either way each value's
 * counts are summed, most common first.
 */
export function expandFacet(
	rows: Record<string, string>[],
	field: string,
	multiValue: boolean,
) {
	const totals = new Map<string, number>();
	for (const row of rows) {
		const raw = row[field];
		const count = Number(row.count);
		if (!raw || !Number.isFinite(count)) continue;
		for (const value of multiValue ? raw.split(",") : [raw]) {
			if (value) totals.set(value, (totals.get(value) ?? 0) + count);
		}
	}
	return [...totals]
		.map(([value, count]) => ({ value, count }))
		.toSorted((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}
