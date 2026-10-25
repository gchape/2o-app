import {
	ArrowRight01Icon,
	Clock01Icon,
	Search01Icon,
	Tag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Section } from "#/components/layout/container";
import { SectionHeader } from "#/components/layout/section-header";
import { priceCheckNote } from "#/features/stats/format-checked-at";
import { languageTags, useLocale } from "#/i18n/locale";
import { useTranslation } from "#/i18n/translate";

type HowItWorksProps = {
	warehouses: number;
	checkedAt: string | null;
};

const steps = [
	{
		icon: Search01Icon,
		label: "Find",
		title: "A wider search.",
		body: "Discover shoes and clothing from wholesale stores, brought together in one place.",
	},
	{
		icon: Tag01Icon,
		label: "Compare",
		title: "See the value.",
		body: "Compare listed prices and discounts, with sizes and colours that help you find the right fit.",
	},
	{
		icon: ArrowRight01Icon,
		label: "Select",
		title: "Less to sift through.",
		body: "Start with in-stock deals ranked by discount. Narrow the selection by brand, size, colour or budget.",
	},
	{
		icon: Clock01Icon,
		label: "Refresh",
		title: "Keep an eye on prices.",
		body: "Check the latest recorded prices and availability. We show when prices were last checked, so you know how recent they are.",
	},
];

/** Explain the shopping experience without exposing the sourcing implementation. */
export function HowItWorks({ warehouses, checkedAt }: HowItWorksProps) {
	const t = useTranslation();
	const locale = useLocale();
	return (
		<Section id="how-it-works" className="border-y bg-muted/35">
			<SectionHeader
				eyebrow={t("How it works")}
				title={t("More finding. Less searching.")}
				description={t(
					"From a wider selection to a shorter shortlist. A simpler way to discover your next pair or everyday favourite.",
				)}
			/>

			<ol className="mt-9 grid overflow-hidden rounded-2xl border bg-background sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
				{steps.map((step, i) => (
					<li
						key={t(step.label)}
						className="relative p-6 max-sm:[&:not(:last-child)]:border-b sm:max-lg:[&:nth-child(-n+2)]:border-b sm:max-lg:[&:nth-child(odd)]:border-r lg:p-7 lg:[&:not(:last-child)]:border-r"
					>
						<div className="flex items-center justify-between gap-4">
							<span className="flex size-11 items-center justify-center rounded-xl bg-brand/15 text-foreground dark:text-brand">
								<HugeiconsIcon icon={step.icon} size={21} aria-hidden="true" />
							</span>
							<span
								aria-hidden="true"
								className="type-num text-3xl text-muted-foreground/35"
							>
								{String(i + 1).padStart(2, "0")}
							</span>
						</div>
						<p className="type-eyebrow mt-7 text-muted-foreground">
							{t(step.label)}
						</p>
						<h3 className="type-card-title mt-2 text-xl">{t(step.title)}</h3>
						<p className="type-body mt-3 text-sm text-muted-foreground">
							{t(step.body)}
						</p>
					</li>
				))}
			</ol>

			<div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
				<p className="flex items-start gap-2">
					<HugeiconsIcon
						icon={Clock01Icon}
						size={17}
						className="mt-0.5 shrink-0"
						aria-hidden="true"
					/>
					{checkedAt
						? priceCheckNote(checkedAt, undefined, locale)
						: t("Price-check history will appear with the first update.")}
				</p>
				{warehouses > 0 && (
					<p>
						<span className="font-semibold text-foreground">
							{warehouses.toLocaleString(languageTags[locale])}
						</span>{" "}
						{warehouses === 1
							? t("store in the current selection")
							: t("stores in the current selection")}
					</p>
				)}
			</div>
		</Section>
	);
}
