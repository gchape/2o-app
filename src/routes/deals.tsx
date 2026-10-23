import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { InfiniteScrollFooter } from "#/components/infinite-scroll-footer";
import { Container } from "#/components/layout/container";
import { site } from "#/data/site";
import {
	DealCard,
	dealImageLoading,
} from "#/features/catalog/components/deal-card";
import { dealsQuery } from "#/features/catalog/product.queries";
import { priceCheckNote } from "#/features/stats/format-checked-at";
import { statsQuery } from "#/features/stats/stats.queries";
import { pageTitle } from "#/lib/seo";

export const Route = createFileRoute("/deals")({
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.infiniteQuery(dealsQuery),
			context.queryClient.query(statsQuery),
		]);
	},
	head: () => ({ meta: [{ title: pageTitle("Deals") }] }),
	component: DealsPage,
});

function DealsPage() {
	const {
		data,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
		isFetchNextPageError,
	} = useInfiniteQuery(dealsQuery);
	const { data: stats } = useSuspenseQuery(statsQuery);

	const deals = data?.pages.flatMap((page) => page.deals) ?? [];

	return (
		<Container className="py-8">
			<h1 className="type-display text-3xl md:text-4xl">All deals</h1>
			<p className="mt-2 text-muted-foreground">
				Products on sale, biggest discount first.{" "}
				{priceCheckNote(stats.checkedAt)}
			</p>

			{deals.length === 0 ? (
				<p className="py-10 text-muted-foreground">
					No deals right now. New prices land every morning at{" "}
					{site.priceCheckTime}.
				</p>
			) : (
				<ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
					{deals.map((deal, i) => (
						<li key={deal.id}>
							<DealCard deal={deal} loading={dealImageLoading(i)} />
						</li>
					))}
				</ul>
			)}

			<InfiniteScrollFooter
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
				isError={isFetchNextPageError}
				fetchNextPage={fetchNextPage}
			/>
		</Container>
	);
}
