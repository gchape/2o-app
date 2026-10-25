import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Container } from "#/components/layout/container";
import { LinkButton } from "#/components/link-button";
import { buttonVariants } from "#/components/ui/button";
import { site } from "#/data/site";
import { SkewTag } from "#/features/catalog/components/skew-tag";
import { formatCheckedAt } from "#/features/stats/format-checked-at";
import type { Stats } from "#/features/stats/stats.schema";
import { languageTags, useLocale } from "#/i18n/locale";
import { useTranslation } from "#/i18n/translate";
import { cn } from "#/lib/utils";

const Stat = ({ label, value }: { label: string; value: string }) => {
	const numeric = /^[\d,.]+$/.test(value);
	return (
		<div>
			<dt className="type-eyebrow text-white/60">{label}</dt>
			<dd
				className={cn(
					"type-num mt-2 flex min-h-9 items-end",
					numeric ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl",
				)}
			>
				{value}
			</dd>
		</div>
	);
};

type HeroProps = {
	stats: Stats;
	/** Biggest discount among today's deals, if there are any. */
	topDiscount?: number;
};

export function Hero({ stats, topDiscount }: HeroProps) {
	const t = useTranslation();
	const locale = useLocale();
	const lines = t(site.tagline).match(/[^.]+(?:\.|$)/g) ?? [t(site.tagline)];

	const items = [
		{
			label: t("Deals live now"),
			value: stats.deals.toLocaleString(languageTags[locale]),
		},
		{
			label: t("Warehouses checked"),
			value: stats.warehouses.toLocaleString(languageTags[locale]),
		},
		{
			label: t("Last price check"),
			value: stats.checkedAt ? formatCheckedAt(stats.checkedAt) : t("Not yet"),
		},
	];

	return (
		<section className="brand-surface hero-scene relative isolate flex items-center overflow-hidden py-14 sm:py-18 md:min-h-140 md:py-20">
			<Container className="text-white">
				<div className="grid items-center gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
					<div className="relative z-10 min-w-0">
						{topDiscount ? (
							<SkewTag className="text-sm">
								{t("Up to {{discount}}% off today", { discount: topDiscount })}
							</SkewTag>
						) : null}

						<h1 className="type-display mt-6 max-w-3xl text-[clamp(2.5rem,5.5vw,4.75rem)] leading-[1.04]">
							{lines.map((line) => (
								<span key={line} className="block">
									{line.trim()}
								</span>
							))}
						</h1>

						<p className="type-body mt-6 max-w-md text-base text-white/80 sm:text-lg">
							{t(site.heroPitch)}
						</p>

						<div className="mt-8 flex flex-wrap items-center gap-3">
							{topDiscount ? (
								<a
									href="#deals"
									className={cn(
										buttonVariants({ size: "lg" }),
										"h-auto min-h-12 max-w-full whitespace-normal rounded-lg px-6 py-3 text-center text-sm font-semibold sm:min-h-13 sm:px-7",
									)}
								>
									{t("See today's biggest drops")}
									<HugeiconsIcon icon={ArrowDown01Icon} size={16} />
								</a>
							) : (
								<LinkButton to="/deals" size="lg">
									{t("All deals")}
								</LinkButton>
							)}
						</div>
					</div>
					<div
						aria-hidden="true"
						className="hero-art-stage pointer-events-none relative isolate mx-auto w-full max-w-88 select-none sm:max-w-md lg:max-w-none"
					>
						<img
							src="/images/hero-shopping-3d.webp"
							srcSet="/images/hero-shopping-3d-small.webp 600w, /images/hero-shopping-3d.webp 1000w"
							sizes="(min-width: 1280px) 530px, (min-width: 1024px) 44vw, (min-width: 640px) 448px, 352px"
							width={1000}
							height={1000}
							alt=""
							fetchPriority="high"
							className="hero-shopping-art h-auto w-full object-contain"
						/>
					</div>
				</div>

				<dl className="mt-8 flex flex-wrap gap-x-8 gap-y-6 border-t border-white/15 pt-6 sm:gap-x-12 lg:mt-10">
					{items.map((item) => (
						<Stat key={item.label} {...item} />
					))}
				</dl>
			</Container>
		</section>
	);
}
