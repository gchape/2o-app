import { Section } from "#/components/layout/container";
import { LinkButton } from "#/components/link-button";
import { site } from "#/data/site";
import { SkewTag } from "#/features/catalog/components/skew-tag";

/** Last call at the bottom of the page: one button to everything that is on sale. */
export function ClosingBanner({ total }: { total: number }) {
	if (total === 0) return null;

	return (
		<Section className="bg-neutral-950 py-14 text-white">
			<div className="flex flex-wrap items-center justify-between gap-6">
				<div>
					<SkewTag className="text-sm">New prices every morning</SkewTag>
					<h2 className="type-display mt-4 text-3xl md:text-5xl">
						Find your next pair.
					</h2>
					<p className="mt-2 max-w-md text-white/70">
						{site.name} checks the wholesale stores so you don't have to.
					</p>
				</div>

				<LinkButton to="/deals" size="lg" className="h-12 rounded-xl px-6">
					See all {total.toLocaleString("en-US")} deals
				</LinkButton>
			</div>
		</Section>
	);
}
