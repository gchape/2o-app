import { describe, expect, it } from "vitest";
import { schemaArgs } from "./catalog-fields";
import { DEFAULT_FILTERS } from "./catalog-filters";
import {
	buildQuery,
	escapeTag,
	expandFacet,
	facetPipeline,
	sortClause,
	textClause,
} from "./catalog-query";

const listing = { mode: "listing" } as const;

describe("escapeTag", () => {
	it("escapes spaces and punctuation but leaves letters and digits", () => {
		expect(escapeTag("New Balance")).toBe("New\\ Balance");
		expect(escapeTag("38.5")).toBe("38\\.5");
		expect(escapeTag("2xl")).toBe("2xl");
	});
});

describe("textClause", () => {
	it("turns words into one prefix clause each", () => {
		expect(textClause("Nike air")).toBe("@q:nike* @q:air*");
	});

	it("cannot carry query syntax", () => {
		expect(textClause('air) | @brand:{x} "')).toBe("@q:air* @q:brand*");
		expect(textClause("-(*)")).toBe("");
	});

	it("is empty for nothing searchable", () => {
		expect(textClause(undefined)).toBe("");
		expect(textClause("  a  ")).toBe("");
	});

	it("caps the number of terms", () => {
		expect(textClause("aa bb cc dd ee ff gg hh ii jj").split(" ")).toHaveLength(
			8,
		);
	});
});

describe("buildQuery", () => {
	it("matches everything when nothing narrows it", () => {
		expect(buildQuery(listing, DEFAULT_FILTERS)).toBe("*");
	});

	it("scopes to a department and category", () => {
		expect(
			buildQuery(
				{ ...listing, department: "men", category: "shoes" },
				DEFAULT_FILTERS,
			),
		).toBe("@department:{men} @category:{shoes}");
	});

	it("ORs values within a facet and ANDs facets together", () => {
		expect(
			buildQuery(listing, {
				...DEFAULT_FILTERS,
				brands: ["Nike", "New Balance"],
				sizes: ["41"],
				colors: ["black"],
			}),
		).toBe("@brand:{Nike | New\\ Balance} @sizes:{41} @colors:{black}");
	});

	it("renders open and closed price ranges", () => {
		expect(buildQuery(listing, { ...DEFAULT_FILTERS, minPrice: 5000 })).toBe(
			"@price:[5000 +inf]",
		);
		expect(buildQuery(listing, { ...DEFAULT_FILTERS, maxPrice: 9000 })).toBe(
			"@price:[-inf 9000]",
		);
		expect(
			buildQuery(listing, { ...DEFAULT_FILTERS, minPrice: 1, maxPrice: 2 }),
		).toBe("@price:[1 2]");
	});

	it("restricts to discounted products for the sale toggle and the deals scope", () => {
		expect(buildQuery(listing, { ...DEFAULT_FILTERS, sale: true })).toBe(
			"@discount:[1 +inf]",
		);
		expect(buildQuery({ mode: "deals" }, DEFAULT_FILTERS)).toBe(
			"@discount:[1 +inf]",
		);
	});
});

describe("sortClause / facetPipeline / schemaArgs", () => {
	it("sorts on the unique keys", () => {
		expect(sortClause("price-desc")).toEqual(["SORTBY", "sortPrice", "DESC"]);
		expect(sortClause("relevance")).toEqual([]);
	});

	it("groups a facet by its own field", () => {
		expect(facetPipeline("sizes")).toContain("@sizes");
	});

	it("declares path, alias and type for each field", () => {
		const args = schemaArgs();
		expect(args.slice(0, 4)).toEqual(["$.searchText", "AS", "q", "TEXT"]);
	});

	it("gives the multi-value tags a comma separator", () => {
		const args = schemaArgs().join(" ");
		expect(args).toContain("$.sizes AS sizes TAG SEPARATOR ,");
		expect(args).toContain("$.colors AS colors TAG SEPARATOR ,");
	});
});

describe("expandFacet", () => {
	it("splits joined values and sums their counts", () => {
		expect(
			expandFacet(
				[
					{ sizes: "40,41", count: "2" },
					{ sizes: "41", count: "3" },
					{ sizes: "m", count: "1" },
				],
				"sizes",
				true,
			),
		).toEqual([
			{ value: "41", count: 5 },
			{ value: "40", count: 2 },
			{ value: "m", count: 1 },
		]);
	});

	it("keeps single-value fields whole and skips unreadable rows", () => {
		expect(
			expandFacet(
				[
					{ brand: "New Balance", count: "1" },
					{ count: "4" },
					{ brand: "Nike", count: "x" },
				],
				"brand",
				false,
			),
		).toEqual([{ value: "New Balance", count: 1 }]);
	});
});
