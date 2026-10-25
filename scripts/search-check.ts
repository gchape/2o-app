/**
 * Checks that your Redis can do everything the storefront's search needs, by
 * building a throwaway index from the real schema and running the real query
 * builders against three fake products.
 *
 *   pnpm search:check
 *
 * Run it after changing the Redis image or version. Each failure says what to fix.
 */
import "dotenv/config"; // must run before the Redis client reads process.env
import {
	buildCatalogDocs,
	type CatalogDoc,
	type SourceProduct,
} from "#/features/search/catalog-doc";
import { schemaArgs } from "#/features/search/catalog-fields";
import {
	type CatalogFilters,
	type CatalogScope,
	type CatalogSort,
	DEFAULT_FILTERS,
} from "#/features/search/catalog-filters";
import {
	buildQuery,
	expandFacet,
	facetOptions,
	sortOptions,
} from "#/features/search/catalog-query";
import { ft } from "#/features/search/redis-ft.server";
import { getRedis } from "#/server/redis.server";

const run = Date.now().toString(36);
const INDEX = `smoke_${run}`;
const PREFIX = `smoke:${run}:`;

const sku = (
	color: string,
	size: string,
	price: number,
	originalPrice: number | null = null,
	discount = 0,
) => ({ color, size, price, originalPrice, discount, imageUrl: null });

const fixture: SourceProduct[] = [
	{
		id: "a",
		slug: "a",
		name: "Nike Air Runner",
		brand: "Nike",
		department: "men",
		category: "shoes",
		currency: "GEL",
		skus: [
			sku("black", "40", 8000, 10000, 20),
			sku("white", "41", 14000, 20000, 30),
		],
	},
	{
		id: "b",
		slug: "b",
		name: "New Balance Retro 90",
		brand: "New Balance",
		department: "women",
		category: "shoes",
		currency: "GEL",
		skus: [sku("grey", "38", 12000, 20000, 40)],
	},
	{
		id: "c",
		slug: "c",
		name: "Adidas Essential Hoodie",
		brand: "Adidas",
		department: "men",
		category: "clothing",
		currency: "GEL",
		skus: [sku("navy", "m", 5000), sku("navy", "l", 5000)],
	},
];

type Query = {
	scope?: CatalogScope;
	filters?: Partial<CatalogFilters>;
	sort?: CatalogSort;
	offset?: number;
	limit?: number;
};

const search = (q: Query = {}) =>
	ft.search<CatalogDoc>(
		INDEX,
		buildQuery(q.scope ?? { mode: "listing" }, {
			...DEFAULT_FILTERS,
			...q.filters,
		}),
		{
			sort: sortOptions(q.sort ?? "relevance", q.scope ?? { mode: "listing" }),
			offset: q.offset ?? 0,
			limit: q.limit ?? 10,
		},
	);

const ids = async (q?: Query) => (await search(q)).docs.map((d) => d.id);
const sorted = async (q?: Query) => (await ids(q)).toSorted();

const same = (actual: unknown, expected: unknown) => {
	if (JSON.stringify(actual) !== JSON.stringify(expected)) {
		throw new Error(
			`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
		);
	}
};

const counts = (rows: Record<string, string>[], field: string) =>
	Object.fromEntries(
		rows.map((row) => [row[field], Number(row.count)]).toSorted(),
	);

type Check = { name: string; hint: string; test: () => Promise<void> };

const checks: Check[] = [
	{
		name: "Search and JSON modules are loaded",
		hint: "Use the redis:8.10.2-alpine image. If you keep a `command:` override in docker-compose.yaml, it may be skipping the module flags the image normally passes.",
		test: async () => {
			const list = JSON.stringify(
				await (await getRedis()).sendCommand(["MODULE", "LIST"]),
			);
			if (!/search/i.test(list)) throw new Error("no search module");
			if (!/json/i.test(list)) throw new Error("no json module");
		},
	},
	{
		name: "Index builds from the production schema and fills from JSON documents",
		hint: "FT.CREATE rejected a field, or the match-all query was refused. Compare FIELDS in catalog-fields.ts and buildQuery in catalog-query.ts with your module version.",
		test: async () => {
			const { total } = await search({ limit: 0 });
			same(total, fixture.length);
		},
	},
	{
		name: "Prefix text search, across brand and name",
		hint: "Text fields or prefix queries aren't supported, or the per-term @q:term* clauses were rejected.",
		test: async () => {
			same(await ids({ filters: { q: "ni ru" } }), ["a"]);
			same(await ids({ filters: { q: "adid" } }), ["c"]);
		},
	},
	{
		name: "Tag filters, including values with spaces",
		hint: "Check escapeTag in catalog-query.ts against how your version parses TAG values.",
		test: async () => {
			same(await ids({ filters: { brands: ["New Balance"] } }), ["b"]);
			same(
				await ids({
					scope: { department: "men", category: "shoes", mode: "listing" },
				}),
				["a"],
			);
		},
	},
	{
		name: "Multi-value tags (several sizes and colors per product)",
		hint: "The comma-separated `sizes` / `colors` strings didn't split into separate tags. Check the SEPARATOR in catalog-fields.ts and that the index was rebuilt.",
		test: async () => {
			same(await ids({ filters: { sizes: ["41"] } }), ["a"]);
			same(await ids({ filters: { sizes: ["m"] } }), ["c"]);
			same(await sorted({ filters: { colors: ["navy", "white"] } }), [
				"a",
				"c",
			]);
		},
	},
	{
		name: "Numeric price range and the on-sale filter",
		hint: "Numeric range queries failed; check the @price field in the index.",
		test: async () => {
			same(await ids({ filters: { minPrice: 6000, maxPrice: 9000 } }), ["a"]);
			same(await sorted({ filters: { sale: true } }), ["a", "b"]);
		},
	},
	{
		name: "SORTBY on FT.SEARCH, ascending and descending",
		hint: "Your version can't sort inside FT.SEARCH. The fix is to run the same query through FT.AGGREGATE with LOAD and SORTBY; only ft.search in redis-ft.server.ts changes.",
		test: async () => {
			same(await ids({ sort: "price-asc" }), ["c", "a", "b"]);
			same(await ids({ sort: "price-desc" }), ["b", "a", "c"]);
			same(await ids({ sort: "name" }), ["c", "b", "a"]);
			same(await ids({ sort: "discount", filters: { sale: true } }), [
				"b",
				"a",
			]);
		},
	},
	{
		name: "Deals filter and sort by the displayed variant's price",
		hint: "Check dealPrice and sortDealPrice in the index schema and rebuild the catalog documents.",
		test: async () => {
			const scope = { mode: "deals" } as const;
			same(await ids({ scope, filters: { maxPrice: 13000 } }), ["b"]);
			same(await ids({ scope, sort: "price-asc" }), ["b", "a"]);
			same(await ids({ scope, sort: "price-desc" }), ["a", "b"]);
		},
	},
	{
		name: "Pagination: offset, limit and total",
		hint: "LIMIT misbehaves alongside SORTBY on your version.",
		test: async () => {
			const page = await search({ sort: "price-asc", offset: 1, limit: 1 });
			same(
				page.docs.map((d) => d.id),
				["a"],
			);
			same(page.total, 3);
		},
	},
	{
		name: "Facet counts per brand",
		hint: "FT.AGGREGATE GROUPBY on a TAG field failed; the filter bar's brand list depends on it.",
		test: async () => {
			const rows = await ft.aggregate(INDEX, "*", facetOptions("brand"));
			same(counts(rows, "brand"), { Adidas: 1, "New Balance": 1, Nike: 1 });
		},
	},
	{
		name: "Facet counts split multi-value tags (sizes)",
		hint: "GROUPBY on the multi-value sizes tag failed or returned values expandFacet can't split. If it keeps failing, derive size and color options from Postgres (a cached SELECT DISTINCT).",
		test: async () => {
			const rows = await ft.aggregate(INDEX, "*", facetOptions("sizes"));
			same(
				expandFacet(rows, "sizes", true)
					.map((o) => o.value)
					.toSorted(),
				["38", "40", "41", "l", "m"],
			);
		},
	},
	{
		name: "Price bounds (cheapest and dearest)",
		hint: "Sorting by sortPrice failed; the price slider's range reads both ends from it.",
		test: async () => {
			const [lo] = (await search({ sort: "price-asc", limit: 1 })).docs;
			const [hi] = (await search({ sort: "price-desc", limit: 1 })).docs;
			same([lo?.price, hi?.price], [5000, 12000]);
		},
	},
];

/** Indexing is asynchronous, so wait for the fixture to appear before any check runs. */
async function waitForIndexing() {
	const deadline = Date.now() + 5_000;
	while (Date.now() < deadline) {
		try {
			if ((await search({ limit: 0 })).total === fixture.length) return;
		} catch {
			// The check itself reports a query that never works.
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
}

async function main() {
	const redis = await getRedis();
	let failed = 0;

	try {
		await ft.create(INDEX, PREFIX, schemaArgs());
		const batch = redis.multi();
		for (const doc of buildCatalogDocs(fixture)) {
			batch.addCommand(["JSON.SET", PREFIX + doc.id, "$", JSON.stringify(doc)]);
		}
		await batch.execAsPipeline();
	} catch (error) {
		console.log(
			`✗ Could not create the test index: ${error instanceof Error ? error.message : error}`,
		);
		console.log(
			"  Is Redis running with the Search and JSON modules? (docker compose up -d redis)",
		);
		process.exit(1);
	}

	await waitForIndexing();

	for (const { name, hint, test } of checks) {
		try {
			await test();
			console.log(`✓ ${name}`);
		} catch (error) {
			failed++;
			console.log(`✗ ${name}`);
			console.log(`    ${error instanceof Error ? error.message : error}`);
			console.log(`    → ${hint}`);
		}
	}

	await ft.dropIndex(INDEX).catch(() => undefined);
	await redis.del(buildCatalogDocs(fixture).map((doc) => PREFIX + doc.id));

	console.log(
		failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`,
	);
	process.exit(failed === 0 ? 0 : 1);
}

await main();
