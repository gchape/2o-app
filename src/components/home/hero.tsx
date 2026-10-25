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
		<dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/60">
			{label}
		</dt>
		<dd className="type-num mt-2 text-2xl sm:text-3xl">{value}</dd>
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
		<section className="relative isolate flex items-center overflow-hidden bg-neutral-950 py-14 sm:py-18 md:min-h-140 md:py-20">
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

				<h1 className="type-display mt-6 max-w-3xl text-[clamp(2.5rem,6.2vw,5.25rem)] leading-[1.04]">
					{lines.map((line) => (
						<span key={line} className="block">
							{line.trim()}
						</span>
					))}
				</h1>

				<p className="mt-6 max-w-md text-base leading-relaxed text-white/80 sm:text-lg">
					{site.heroPitch}
				</p>

				<div className="mt-8 flex flex-wrap items-center gap-3">
					<a
						href="#deals"
						className={cn(
							buttonVariants({ size: "lg" }),
							"h-12 rounded-lg px-6 text-sm font-semibold sm:h-13 sm:px-7",
						)}
					>
						See today's biggest drops
						<HugeiconsIcon icon={ArrowDown01Icon} size={16} />
					</a>
				</div>

				<dl className="mt-12 flex flex-wrap gap-x-8 gap-y-6 sm:gap-x-12 md:mt-14">
					{items.map((item) => (
						<Stat key={item.label} {...item} />
					))}
				</dl>
			</Container>
		</section>
	);
}
