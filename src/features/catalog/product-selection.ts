import { minBy, uniq } from "es-toolkit";

export type SelectableSku = {
	id: string;
	color: string;
	size: string;
	imageUrl: string | null;
	price: number;
	originalPrice: number | null;
	inStock: boolean;
};

type SkuChoice = { color?: string; sku?: string };

/**
 * Derives everything the product page renders from the SKU list and the
 * (URL-backed) choice. Invalid or stale choices silently fall back to a sane
 * default, so a hand-edited link can never produce a broken page.
 */
export function resolveSelection<T extends SelectableSku>(
	skus: readonly T[],
	choice: SkuChoice,
) {
	const colors = uniq(skus.map((s) => s.color));
	const color = colors.includes(choice.color ?? "")
		? choice.color
		: (skus.find((s) => s.inStock)?.color ?? colors[0]);

	const colorSkus = skus.filter((s) => s.color === color);
	const selected = colorSkus.find((s) => s.id === choice.sku && s.inStock);

	// Before a size is picked, advertise the cheapest available option.
	const shown =
		selected ??
		minBy(
			colorSkus.filter((s) => s.inStock),
			(s) => s.price,
		) ??
		colorSkus[0];

	return {
		colors,
		color,
		colorSkus,
		selected,
		shown,
		imageUrl: colorSkus.find((s) => s.imageUrl)?.imageUrl ?? null,
	};
}

export type SkuSelection<T extends SelectableSku> = ReturnType<
	typeof resolveSelection<T>
>;
