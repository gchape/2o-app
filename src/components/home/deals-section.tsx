import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { Section } from "#/components/layout/container";
import { Button } from "#/components/ui/button";
import {
	DealCard,
	dealImageLoading,
} from "#/features/catalog/components/deal-card";
import type { Deal } from "#/features/catalog/product.types";
import { priceCheckNote } from "#/features/stats/format-checked-at";
import { useScrollEdges } from "#/hooks/use-scroll-edges";

type DealsSectionProps = {
	deals: Deal[];
	/** Every deal that is live, which can be more than the row shows. */
	total: number;
	/** ISO timestamp of the last price check, if there has been one. */
	checkedAt: string | null;
};

export function DealsSection({ deals, total, checkedAt }: DealsSectionProps) {
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
		<Section id="deals" className="scroll-mt-8 py-16 md:py-24">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="type-title text-3xl md:text-4xl">
						Today's biggest drops
					</h2>
					<p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
						Sorted by discount. {priceCheckNote(checkedAt)}
					</p>
				</div>

				<div className="flex items-center gap-4">
					<Link
						to="/deals"
						className="py-2 font-semibold text-sm underline decoration-1 underline-offset-8"
					>
						See all {total.toLocaleString("en-US")} deals
					</Link>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="icon-lg"
							className="rounded-full"
							aria-label="Previous deals"
							disabled={atStart}
							onClick={() => scrollByPage(-1)}
						>
							<HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
						</Button>
						<Button
							type="button"
							variant="outline"
							size="icon-lg"
							className="rounded-full"
							aria-label="Next deals"
							disabled={atEnd}
							onClick={() => scrollByPage(1)}
						>
							<HugeiconsIcon icon={ArrowRight01Icon} size={18} />
						</Button>
					</div>
				</div>
			</div>

			<ul
				ref={scroller}
				className="mt-9 flex snap-x snap-mandatory gap-5 md:mt-10 md:gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				{deals.map((deal, i) => (
					<li
						key={deal.id}
						className="w-[68%] shrink-0 snap-start sm:w-[40%] md:w-[calc((100%-4.5rem)/4)]"
					>
						<DealCard deal={deal} loading={dealImageLoading(i)} />
					</li>
				))}
			</ul>
		</Section>
	);
}
