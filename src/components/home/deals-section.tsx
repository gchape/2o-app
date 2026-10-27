import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { Section } from "#/components/layout/container";
import { SectionHeader } from "#/components/layout/section-header";
import { Button } from "#/components/ui/button";
import type { Deal } from "#/data/catalog.types";
import {
	DealCard,
	dealImageLoading,
} from "#/features/catalog/components/deal-card";
import { priceCheckNote } from "#/features/stats/format-checked-at";
import { useScrollEdges } from "#/hooks/use-scroll-edges";
import { languageTags, useLocale } from "#/i18n/locale";
import { useTranslation } from "#/i18n/translate";

type DealsSectionProps = {
	deals: Deal[];
	/** Every deal that is live, which can be more than the row shows. */
	total: number;
	/** ISO timestamp of the last price check, if there has been one. */
	checkedAt: string | null;
};

export function DealsSection({ deals, total, checkedAt }: DealsSectionProps) {
	const t = useTranslation();
	const locale = useLocale();
	const scroller = useRef<HTMLUListElement>(null);
	const { atStart, atEnd } = useScrollEdges(scroller);

	if (deals.length === 0) return null;

	const scrollByPage = (direction: -1 | 1) => {
		const el = scroller.current;
		if (!el) return;
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		el.scrollBy({
			left: direction * el.clientWidth * 0.8,
			behavior: reduceMotion ? "auto" : "smooth",
		});
	};

	return (
		<Section id="deals" className="scroll-mt-8">
			<SectionHeader
				title={t("Today's biggest drops")}
				description={
					<>
						{t("Sorted by discount.")}{" "}
						{priceCheckNote(checkedAt, undefined, locale)}
					</>
				}
				action={
					<div className="flex flex-wrap items-center gap-4">
						<Link
							to="/deals"
							className="py-2 font-semibold text-sm underline decoration-1 underline-offset-8"
						>
							{t("See all {{count}} deals", {
								count: total.toLocaleString(languageTags[locale]),
							})}
						</Link>
						<div className="flex gap-2" hidden={atStart && atEnd}>
							{(
								[
									{
										direction: -1,
										label: "Previous deals",
										icon: ArrowLeft01Icon,
										disabled: atStart,
									},
									{
										direction: 1,
										label: "Next deals",
										icon: ArrowRight01Icon,
										disabled: atEnd,
									},
								] as const
							).map(({ direction, label, icon, disabled }) => (
								<Button
									key={direction}
									type="button"
									variant="outline"
									size="icon-lg"
									className="rounded-full"
									aria-label={t(label)}
									aria-controls="home-deals"
									disabled={disabled}
									onClick={() => scrollByPage(direction)}
								>
									<HugeiconsIcon icon={icon} size={18} aria-hidden="true" />
								</Button>
							))}
						</div>
					</div>
				}
			/>

			<ul
				id="home-deals"
				ref={scroller}
				className="mt-8 flex snap-x snap-mandatory gap-5 md:mt-10 md:gap-6 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
			>
				{deals.map((deal, i) => (
					<li
						key={deal.id}
						className="w-[68%] shrink-0 snap-start sm:w-[40%] md:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)]"
					>
						<DealCard deal={deal} loading={dealImageLoading(i)} />
					</li>
				))}
			</ul>
		</Section>
	);
}
