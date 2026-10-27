import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DealsSection } from "#/components/home/deals-section";
import { DepartmentTiles } from "#/components/home/department-tiles";
import { Hero } from "#/components/home/hero";
import { HowItWorks } from "#/components/home/how-it-works";
import { homeDealsQuery } from "#/features/search/catalog.queries";
import { statsQuery } from "#/features/stats/stats.queries";

export const Route = createFileRoute("/")({
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.query(homeDealsQuery),
			context.queryClient.query(statsQuery),
		]);
	},
	component: HomePage,
});

function HomePage() {
	const { data: deals } = useSuspenseQuery(homeDealsQuery);
	const { data: stats } = useSuspenseQuery(statsQuery);

	return (
		<>
			<Hero stats={stats} topDiscount={deals[0]?.discount} />
			<DealsSection
				deals={deals}
				total={stats.deals}
				checkedAt={stats.checkedAt}
			/>
			<DepartmentTiles />
			<HowItWorks />
		</>
	);
}
