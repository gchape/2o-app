import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Section } from "#/components/layout/container";
import { SectionHeader } from "#/components/layout/section-header";
import { LinkButton } from "#/components/link-button";
import { StepNumber } from "#/components/step-number";
import { useTranslation } from "#/i18n/translate";

const steps = [
	{
		title: "Find your fit",
		body: "Start with a department, then narrow your search by brand, size, colour or budget.",
	},
	{
		title: "Compare the details",
		body: "Check the listed price, available sizes and latest price-check time before adding an item to your cart.",
	},
	{
		title: "Review your order",
		body: "Review shipping, service fees and your final total at checkout before placing your order.",
	},
];

export function HowItWorks() {
	const t = useTranslation();
	return (
		<Section id="how-it-works" className="shopping-guide border-t">
			<SectionHeader
				eyebrow={t("How it works")}
				title={t("A good find, in three steps.")}
				action={
					<LinkButton
						to="/about"
						variant="outline"
						className="h-auto min-h-11 max-w-full whitespace-normal rounded-full bg-background py-3 text-left"
					>
						{t("How we choose our stores")}
						<HugeiconsIcon
							icon={ArrowRight01Icon}
							size={16}
							aria-hidden="true"
						/>
					</LinkButton>
				}
			/>

			<ol className="mt-10 grid gap-4 lg:grid-cols-3 lg:gap-6">
				{steps.map((step, index) => (
					<li
						key={step.title}
						className="process-card relative rounded-2xl border bg-background p-6 sm:p-8"
					>
						<div className="flex items-center gap-4" aria-hidden="true">
							<StepNumber index={index} active />
							<span className="h-px flex-1 bg-border" />
							<span className="size-2 rounded-full bg-brand" />
						</div>
						<h3 className="type-card-title mt-7 text-xl">{t(step.title)}</h3>
						<p className="type-body mt-3 text-sm text-muted-foreground">
							{t(step.body)}
						</p>
					</li>
				))}
			</ol>
		</Section>
	);
}
