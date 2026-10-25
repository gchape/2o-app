import { useId, useState } from "react";
import { Button } from "#/components/ui/button";
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
import { languageTags, useLocale } from "#/i18n/locale";
import { useTranslation } from "#/i18n/translate";
import { ActiveFilters } from "./active-filters";
import { FacetFilter } from "./facet-filter";
import { PriceFilter } from "./price-filter";
import { SearchBox } from "./search-box";

type FilterBarProps = {
	scope: CatalogScope;
	filters: CatalogFilters;
	facets: CatalogFacets;
	total: number;
	onChange: (filters: CatalogFilters) => void;
};

/** Pure composition: every control reads `filters` and reports a change; the URL owns the state. */
export function FilterBar({
	scope,
	filters,
	facets,
	total,
	onChange,
}: FilterBarProps) {
	const t = useTranslation();
	const locale = useLocale();
	const [filtersOpen, setFiltersOpen] = useState(false);
	const filtersId = useId();
	const set = (patch: Partial<CatalogFilters>) =>
		onChange({ ...filters, ...patch });

	const sort = effectiveSort(filters, scope);
	const naturalSort = effectiveSort({ ...filters, sort: undefined }, scope);
	const sortChoices = (Object.keys(sortLabels) as CatalogSort[])
		.filter((value) => value !== "relevance" || filters.q)
		.map((value) => ({ value, label: t(sortLabels[value]) }));

	const isListing = scope.mode === "listing";

	const resultCount = (
		<p
			className="type-caption whitespace-nowrap text-muted-foreground"
			aria-live="polite"
		>
			<span className="type-num text-foreground">
				{total.toLocaleString(languageTags[locale])}
			</span>{" "}
			{total === 1 ? t("result") : t("results")}
		</p>
	);

	const sortControl = (
		<Select
			items={sortChoices}
			value={sort}
			onValueChange={(next) =>
				set({
					sort: next === naturalSort ? undefined : (next as CatalogSort),
				})
			}
		>
			<SelectTrigger
				className="h-11 w-full rounded-lg sm:w-48"
				aria-label={t("Sort by")}
			>
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
	);

	const filterControls = (
		<>
			<FacetFilter
				label={t("Brand")}
				options={facets.brands}
				selected={filters.brands}
				onChange={(brands) => set({ brands })}
			/>
			<FacetFilter
				label={t("Size")}
				layout="chips"
				optionClassName="uppercase"
				options={facets.sizes}
				selected={filters.sizes}
				onChange={(sizes) => set({ sizes })}
			/>
			<FacetFilter
				label={t("Color")}
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
					className="h-10 rounded-lg px-4 aria-pressed:border-foreground/40"
					pressed={filters.sale}
					onPressedChange={(sale) => set({ sale })}
				>
					{t("On sale")}
				</Toggle>
			)}
		</>
	);

	return (
		<div className="mt-7 flex flex-col gap-4 border-y py-5">
			<div className="grid grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[minmax(16rem,22rem)_1fr_auto]">
				<SearchBox
					className="col-span-full w-full md:col-span-1"
					value={filters.q ?? ""}
					onCommit={(q) => set({ q: q.trim() || undefined })}
				/>
				<div className="hidden md:block">{resultCount}</div>
				<div className="hidden md:block">{sortControl}</div>
				<div className="md:hidden">{resultCount}</div>
				<div className="flex items-center justify-end gap-2 md:hidden">
					<Button
						variant="outline"
						className="h-11 rounded-lg px-4"
						aria-expanded={filtersOpen}
						aria-controls={filtersId}
						onClick={() => setFiltersOpen((open) => !open)}
					>
						{filtersOpen ? t("Hide filters") : t("Filters")}
					</Button>
					<div className="w-36 sm:w-44">{sortControl}</div>
				</div>
			</div>

			<div
				id={filtersId}
				className={`${filtersOpen ? "flex" : "hidden"} flex-wrap items-center gap-2 md:flex`}
			>
				{filterControls}
			</div>

			<ActiveFilters
				filters={filters}
				showSale={isListing}
				onChange={onChange}
			/>
		</div>
	);
}
