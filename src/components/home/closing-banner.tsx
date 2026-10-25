import { Section } from "#/components/layout/container";
import { LinkButton } from "#/components/link-button";
import { site } from "#/data/site";
import { SkewTag } from "#/features/catalog/components/skew-tag";
import { languageTags, useLocale } from "#/i18n/locale";
import { useTranslation } from "#/i18n/translate";

/** Last call at the bottom of the page: one button to everything that is on sale. */
export function ClosingBanner({ total }: { total: number }) {
	const t = useTranslation();
	const locale = useLocale();
	if (total === 0) return null;

	return (
		<Section
			className="brand-surface closing-scene text-white"
			spacing="compact"
		>
			<div className="flex flex-wrap items-center justify-between gap-8">
				<div>
					<SkewTag className="text-sm">
						{t("Your next find starts here")}
					</SkewTag>
					<h2 className="type-display mt-5 text-3xl leading-tight md:text-5xl">
						{t("Find your next pair.")}
					</h2>
					<p className="type-body mt-4 max-w-md text-base text-white/70">
						{t(
							"{{brand}} brings the deals together. Find a style, a size, and a price that work for you.",
							{ brand: site.name },
						)}
					</p>
				</div>

				<LinkButton
					to="/deals"
					size="lg"
					className="h-auto min-h-13 max-w-full whitespace-normal rounded-lg px-8 py-3 text-center font-semibold"
				>
					{t("See all {{count}} deals", {
						count: total.toLocaleString(languageTags[locale]),
					})}
				</LinkButton>
			</div>
		</Section>
	);
}
