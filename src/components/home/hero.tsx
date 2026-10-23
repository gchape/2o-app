import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Container } from "#/components/layout/container";
import { buttonVariants } from "#/components/ui/button";
import { site } from "#/data/site";
import { SkewTag } from "#/features/catalog/components/skew-tag";
import { formatCheckedAt } from "#/features/stats/format-checked-at";
import type { Stats } from "#/features/stats/stats.schema";
import { cn } from "#/lib/utils";

const number = new Intl.NumberFormat("en-US");

const Stat = ({ label, value }: { label: string; value: string }) => (
	<div>
		<dt className="text-sm text-white/60">{label}</dt>
		<dd className="type-num mt-1 text-2xl">{value}</dd>
	</div>
);

type HeroProps = {
	stats: Stats;
	/** Biggest discount among today's deals, if there are any. */
	topDiscount?: number;
};

export function Hero({ stats, topDiscount }: HeroProps) {
	const lines = site.tagline.match(/[^.]+(?:\.|$)/g) ?? [site.tagline];

	const items = [
		{ label: "Deals live now", value: number.format(stats.deals) },
		{ label: "Warehouses checked", value: number.format(stats.warehouses) },
		{
			label: "Last price check",
			value: stats.checkedAt ? formatCheckedAt(stats.checkedAt) : "Not yet",
		},
	];

	return (
		<section className="relative isolate flex items-center overflow-hidden bg-neutral-950 py-12 md:min-h-108 md:py-16">
			<img
				src="/images/hero.webp"
				alt=""
				fetchPriority="high"
				className="absolute inset-0 -z-10 size-full object-cover object-right"
			/>
			<div className="absolute inset-0 -z-10 bg-linear-to-r from-black via-black/60 to-transparent md:via-black/30" />

			<Container className="text-white">
				{topDiscount ? (
					<SkewTag className="text-sm">Up to {topDiscount}% off today</SkewTag>
				) : null}

				<h1 className="type-display mt-5 max-w-2xl text-4xl sm:text-5xl md:text-7xl">
					{lines.map((line) => (
						<span key={line} className="block">
							{line.trim()}
						</span>
					))}
				</h1>

				<p className="mt-4 max-w-sm text-lg text-white/80">{site.heroPitch}</p>

				<div className="mt-7 flex flex-wrap items-center gap-3">
					<a
						href="#deals"
						className={cn(
							buttonVariants({ size: "lg" }),
							"h-11 rounded-xl px-5",
						)}
					>
						See today's biggest drops
						<HugeiconsIcon icon={ArrowDown01Icon} size={16} />
					</a>
				</div>

				<dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
					{items.map((item) => (
						<Stat key={item.label} {...item} />
					))}
				</dl>
			</Container>
		</section>
	);
}
