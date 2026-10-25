import { Section } from "#/components/layout/container";
import { LinkButton } from "#/components/link-button";
import { site } from "#/data/site";
import { SkewTag } from "#/features/catalog/components/skew-tag";

/** Last call at the bottom of the page: one button to everything that is on sale. */
export function ClosingBanner({ total }: { total: number }) {
	if (total === 0) return null;

	return (
		<Section className="bg-neutral-950 py-16 text-white md:py-22">
			<div className="flex flex-wrap items-center justify-between gap-8">
				<div>
					<SkewTag className="text-sm">New prices every morning</SkewTag>
					<h2 className="type-display mt-5 text-3xl leading-tight md:text-5xl">
						Find your next pair.
					</h2>
					<p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
						{site.name} checks the wholesale stores so you don't have to.
					</p>
				</div>

				<LinkButton
					to="/deals"
					size="lg"
					className="h-13 rounded-lg px-8 font-semibold"
				>
					See all {total.toLocaleString("en-US")} deals
				</LinkButton>
			</div>
		</Section>
	);
}
