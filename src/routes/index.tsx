import { createFileRoute } from "@tanstack/react-router";
import { ClosingBanner } from "#/components/home/closing-banner";
import { DepartmentTiles } from "#/components/home/department-tiles";
import { Hero } from "#/components/home/hero";
import { HowItWorks } from "#/components/home/how-it-works";
import { PromoCarousel } from "#/components/home/promo-carousel";
import { TrustStrip } from "#/components/home/trust-strip";

export const Route = createFileRoute("/")({
	component: () => (
		<div>
			<Hero />
			<TrustStrip />
			<PromoCarousel />
			<DepartmentTiles />
			<HowItWorks />
			<ClosingBanner />
		</div>
	),
});
