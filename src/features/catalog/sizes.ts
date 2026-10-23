import type { Category } from "#/data/catalog";

const CLOTHING_SIZES = ["xxs", "xs", "s", "m", "l", "xl", "2xl", "xxl", "3xl"];

/** Numeric rank used to order sizes within a category; unknown sizes sort last. */
const sizeRank: Record<Category, (size: string) => number> = {
	shoes: Number,
	clothing: (size) => {
		const index = CLOTHING_SIZES.indexOf(size.toLowerCase());
		return index === -1 ? Number.POSITIVE_INFINITY : index;
	},
};

export const compareSizes = (category: Category, a: string, b: string) =>
	sizeRank[category](a) - sizeRank[category](b) ||
	a.localeCompare(b, undefined, { numeric: true });

/** Orders SKUs by color, then by size using the category's size scale. */
export const sortSkus = <T extends { color: string; size: string }>(
	skus: readonly T[],
	category: Category,
) =>
	skus.toSorted(
		(a, b) =>
			a.color.localeCompare(b.color) || compareSizes(category, a.size, b.size),
	);
