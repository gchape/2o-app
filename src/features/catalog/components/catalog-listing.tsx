import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { InfiniteScrollFooter } from "#/components/infinite-scroll-footer";
import { Button } from "#/components/ui/button";
import {
	catalogFacetsQuery,
	catalogQuery,
} from "#/features/search/catalog.queries";
import {
	type CatalogFilters,
	type CatalogScope,
	DEFAULT_FILTERS,
	hasActiveFilters,
} from "#/features/search/catalog-filters";
import { isDeal } from "../product.types";
import { DealCard, dealImageLoading } from "./deal-card";
import { FilterBar } from "./filter-bar";
import { ProductGrid } from "./product-grid";

type CatalogListingProps = {
	scope: CatalogScope;
	filters: CatalogFilters;
	onFiltersChange: (filters: CatalogFilters) => void;
	/** Shown when the scope has no products at all (not when filters hide them). */
	empty?: ReactNode;
};

/**
 * One listing for departments, categories and deals. The URL holds the
 * filters, the server does the filtering, and this only renders the result.
 */
export function CatalogListing({
	scope,
	filters,
	onFiltersChange,
	empty,
}: CatalogListingProps) {
	const {
		data,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
		isFetchNextPageError,
	} = useInfiniteQuery(catalogQuery(scope, filters));
	const { data: facets } = useQuery(catalogFacetsQuery(scope, filters));

	const items = data?.pages.flatMap((page) => page.items) ?? [];
	const total = data?.pages[0]?.total ?? 0;
	const filtered = hasActiveFilters(filters);

	return (
		<>
			{facets && (
				<FilterBar
					scope={scope}
					filters={filters}
					facets={facets}
					onChange={onFiltersChange}
				/>
			)}

			{total > 0 && (
				<p className="mt-4 text-muted-foreground text-sm" aria-live="polite">
					<span className="type-num text-foreground">
						{total.toLocaleString("en-US")}
					</span>{" "}
					{total === 1 ? "result" : "results"}
				</p>
			)}

			{items.length === 0 ? (
				filtered ? (
					<div className="flex flex-col items-start gap-3 py-10">
						<p className="font-medium">Nothing matches these filters.</p>
						<p className="text-muted-foreground text-sm">
							Try a shorter search or remove a filter.
						</p>
						<Button
							variant="outline"
							onClick={() =>
								onFiltersChange({ ...DEFAULT_FILTERS, sort: filters.sort })
							}
						>
							Clear filters
						</Button>
					</div>
				) : (
					(empty ?? (
						<p className="py-10 text-muted-foreground">No products yet.</p>
					))
				)
			) : scope.mode === "deals" ? (
				<ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
					{items.filter(isDeal).map((deal, index) => (
						<li key={deal.id}>
							<DealCard deal={deal} loading={dealImageLoading(index)} />
						</li>
					))}
				</ul>
			) : (
				<ProductGrid products={items} />
			)}

			<InfiniteScrollFooter
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
				isError={isFetchNextPageError}
				fetchNextPage={fetchNextPage}
			/>
		</>
	);
}
