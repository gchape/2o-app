import type { Category, Department } from "#/data/catalog";

/** Bigger than any product count, so `value * SEQ + seq` stays unique and below 2^53. */
const SEQ = 1_000_000;

/**
 * One indexed product. Only in-stock SKUs are summarised, so a product with
 * nothing in stock never enters the index (matching the old listings).
 */
export type CatalogDoc = {
	id: string;
	slug: string;
	name: string;
	/** Omitted rather than null, so the TAG field simply isn't indexed. */
	brand?: string;
	/** Brand and name together, so "nike air" matches across both. */
	searchText: string;
	department: Department;
	category: Category;
	currency: string;
	/** Distinct colors, comma-separated, indexed as a multi-value TAG. */
	colors: string;
	/** Distinct sizes, comma-separated, indexed as a multi-value TAG. */
	sizes: string;
	/** Cheapest in-stock SKU: what listings show. */
	price: number;
	originalPrice: number | null;
	imageUrl: string | null;
	/** Deepest discount among in-stock SKUs; 0 means not on sale. */
	discount: number;
	/** Deepest-discounted SKU: what the deals views show. */
	deal: {
		price: number;
		originalPrice: number;
		imageUrl: string | null;
	} | null;
	/**
	 * Sort keys with a per-product sequence mixed in. A plain SORTBY with ties
	 * would let offset pages overlap or skip; these are unique, so they can't.
	 */
	sort: { name: number; price: number; discount: number };
};

type SourceSku = {
	color: string;
	size: string;
	price: number;
	originalPrice: number | null;
	discount: number;
	imageUrl: string | null;
};

export type SourceProduct = {
	id: string;
	slug: string;
	name: string;
	brand: string | null;
	department: Department;
	category: Category;
	currency: string;
	/** In-stock SKUs only. */
	skus: SourceSku[];
};

/** Distinct values as one TAG string; the index splits it on ",". */
const tagList = (values: string[]) =>
	[...new Set(values.map((value) => value.replaceAll(",", " ").trim()))]
		.filter(Boolean)
		.join(",");

/** Pure on purpose: it is the whole read model, and it is unit-tested. */
export function buildCatalogDocs(products: SourceProduct[]): CatalogDoc[] {
	const stocked = products.filter((p) => p.skus.length > 0);

	const nameRank = new Map(
		stocked
			.toSorted(
				(a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
			)
			.map((p, rank) => [p.id, rank]),
	);

	return stocked
		.toSorted((a, b) => a.id.localeCompare(b.id))
		.map((p, seq): CatalogDoc => {
			const cheapest = p.skus.reduce((a, b) => (b.price < a.price ? b : a));
			const deepest = p.skus.reduce((a, b) =>
				b.discount > a.discount ? b : a,
			);
			const deal =
				deepest.discount > 0 && deepest.originalPrice !== null
					? {
							price: deepest.price,
							originalPrice: deepest.originalPrice,
							imageUrl: deepest.imageUrl,
						}
					: null;

			return {
				id: p.id,
				slug: p.slug,
				name: p.name,
				brand: p.brand ?? undefined,
				searchText: [p.brand, p.name].filter(Boolean).join(" "),
				department: p.department,
				category: p.category,
				currency: p.currency,
				colors: tagList(p.skus.map((s) => s.color)),
				sizes: tagList(p.skus.map((s) => s.size)),
				price: cheapest.price,
				originalPrice: cheapest.originalPrice,
				imageUrl: cheapest.imageUrl,
				discount: deepest.discount,
				deal,
				sort: {
					name: nameRank.get(p.id) ?? 0,
					price: cheapest.price * SEQ + seq,
					discount: deepest.discount * SEQ + seq,
				},
			};
		});
}
