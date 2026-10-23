import { useInfiniteQuery } from "@tanstack/react-query";
import { InfiniteScrollFooter } from "#/components/infinite-scroll-footer";
import type { Category, Department } from "#/data/catalog";
import { productsQuery } from "#/features/catalog/product.queries";
import { ProductGrid } from "./product-grid";

type ProductListingProps = {
	department: Department;
	category?: Category;
};

/** A department or category page: the product grid, loading more as you scroll. */
export function ProductListing({ department, category }: ProductListingProps) {
	const {
		data,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
		isFetchNextPageError,
	} = useInfiniteQuery(productsQuery(department, category));

	const products = data?.pages.flatMap((page) => page.products) ?? [];

	return (
		<>
			<ProductGrid products={products} />
			<InfiniteScrollFooter
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
				isError={isFetchNextPageError}
				fetchNextPage={fetchNextPage}
			/>
		</>
	);
}
