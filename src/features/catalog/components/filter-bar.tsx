import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Toggle } from "#/components/ui/toggle";
import type { CatalogFacets } from "#/features/search/catalog.functions";
import {
	type CatalogFilters,
	type CatalogScope,
	type CatalogSort,
	effectiveSort,
	sortLabels,
} from "#/features/search/catalog-filters";
import { ActiveFilters } from "./active-filters";
import { FacetFilter } from "./facet-filter";
import { PriceFilter } from "./price-filter";
import { SearchBox } from "./search-box";

type FilterBarProps = {
	scope: CatalogScope;
	filters: CatalogFilters;
	facets: CatalogFacets;
	onChange: (filters: CatalogFilters) => void;
};

/** Pure composition: every control reads `filters` and reports a change; the URL owns the state. */
export function FilterBar({
	scope,
	filters,
	facets,
	onChange,
}: FilterBarProps) {
	const set = (patch: Partial<CatalogFilters>) =>
		onChange({ ...filters, ...patch });

	const sort = effectiveSort(filters, scope);
	const naturalSort = effectiveSort({ ...filters, sort: undefined }, scope);
	const sortChoices = (Object.keys(sortLabels) as CatalogSort[])
		.filter((value) => value !== "relevance" || filters.q)
		.map((value) => ({ value, label: sortLabels[value] }));

	const isListing = scope.mode === "listing";

	return (
		<div className="flex flex-col gap-3 pt-4">
			<div className="flex flex-wrap items-center gap-2">
				<SearchBox
					className="w-full sm:w-64"
					value={filters.q ?? ""}
					onCommit={(q) => set({ q: q.trim() || undefined })}
				/>

				<FacetFilter
					label="Brand"
					options={facets.brands}
					selected={filters.brands}
					onChange={(brands) => set({ brands })}
				/>
				<FacetFilter
					label="Size"
					layout="chips"
					optionClassName="uppercase"
					options={facets.sizes}
					selected={filters.sizes}
					onChange={(sizes) => set({ sizes })}
				/>
				<FacetFilter
					label="Color"
					layout="chips"
					optionClassName="capitalize"
					options={facets.colors}
					selected={filters.colors}
					onChange={(colors) => set({ colors })}
				/>
				<PriceFilter
					range={facets.price}
					minPrice={filters.minPrice}
					maxPrice={filters.maxPrice}
					onChange={(price) => set(price)}
				/>

				{isListing && (
					<Toggle
						variant="outline"
						size="sm"
						className="aria-pressed:border-foreground/40"
						pressed={filters.sale}
						onPressedChange={(sale) => set({ sale })}
					>
						On sale
					</Toggle>
				)}

				<div className="ml-auto">
					<Select
						items={sortChoices}
						value={sort}
						onValueChange={(next) =>
							set({
								sort: next === naturalSort ? undefined : (next as CatalogSort),
							})
						}
					>
						<SelectTrigger className="w-48" aria-label="Sort by">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{sortChoices.map((choice) => (
								<SelectItem key={choice.value} value={choice.value}>
									{choice.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<ActiveFilters
				filters={filters}
				showSale={isListing}
				onChange={onChange}
			/>
		</div>
	);
}
