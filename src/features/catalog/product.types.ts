/** One product in a listing, priced at its cheapest in-stock SKU. */
export type ProductListItem = {
	id: string;
	slug: string;
	name: string;
	brand: string | null;
	currency: string;
	price: number;
	originalPrice: number | null;
	imageUrl: string | null;
};

/** A listing item that is on sale, shown at its deepest-discounted SKU. */
export type Deal = ProductListItem & {
	originalPrice: number;
	/** Percent off, rounded. */
	discount: number;
};
