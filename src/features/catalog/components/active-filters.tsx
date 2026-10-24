import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "#/components/ui/button";
import {
	type CatalogFilters,
	DEFAULT_FILTERS,
} from "#/features/search/catalog-filters";
import { formatPriceCompact } from "#/lib/price";

type Chip = { key: string; label: string; clear: Partial<CatalogFilters> };

const capitalize = (text: string) =>
	text.charAt(0).toUpperCase() + text.slice(1);

function priceLabel({ minPrice, maxPrice }: CatalogFilters) {
	if (minPrice != null && maxPrice != null) {
		return `${formatPriceCompact(minPrice)} to ${formatPriceCompact(maxPrice)}`;
	}
	return minPrice != null
		? `From ${formatPriceCompact(minPrice)}`
		: `Up to ${formatPriceCompact(maxPrice ?? 0)}`;
}

function chipsFor(filters: CatalogFilters, showSale: boolean): Chip[] {
	const chips: Chip[] = [];

	if (filters.q) {
		chips.push({ key: "q", label: `“${filters.q}”`, clear: { q: undefined } });
	}
	for (const brand of filters.brands) {
		chips.push({
			key: `brand:${brand}`,
			label: brand,
			clear: { brands: filters.brands.filter((b) => b !== brand) },
		});
	}
	for (const size of filters.sizes) {
		chips.push({
			key: `size:${size}`,
			label: `Size ${size.toUpperCase()}`,
			clear: { sizes: filters.sizes.filter((s) => s !== size) },
		});
	}
	for (const color of filters.colors) {
		chips.push({
			key: `color:${color}`,
			label: capitalize(color),
			clear: { colors: filters.colors.filter((c) => c !== color) },
		});
	}
	if (filters.minPrice != null || filters.maxPrice != null) {
		chips.push({
			key: "price",
			label: priceLabel(filters),
			clear: { minPrice: undefined, maxPrice: undefined },
		});
	}
	if (showSale && filters.sale) {
		chips.push({ key: "sale", label: "On sale", clear: { sale: false } });
	}

	return chips;
}

type ActiveFiltersProps = {
	filters: CatalogFilters;
	/** The deals view is always on sale, so it has no sale chip. */
	showSale: boolean;
	onChange: (filters: CatalogFilters) => void;
};

/** What is narrowing the results right now, each removable with one click. */
export function ActiveFilters({
	filters,
	showSale,
	onChange,
}: ActiveFiltersProps) {
	const chips = chipsFor(filters, showSale);
	if (chips.length === 0) return null;

	return (
		<ul
			className="flex flex-wrap items-center gap-2"
			aria-label="Active filters"
		>
			{chips.map((chip) => (
				<li key={chip.key}>
					<Button
						variant="secondary"
						size="xs"
						aria-label={`Remove filter: ${chip.label}`}
						onClick={() => onChange({ ...filters, ...chip.clear })}
					>
						{chip.label}
						<HugeiconsIcon icon={Cancel01Icon} size={12} />
					</Button>
				</li>
			))}
			<li>
				<Button
					variant="ghost"
					size="xs"
					onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}
				>
					Clear all
				</Button>
			</li>
		</ul>
	);
}
