import {
	Clock01Icon,
	DeliveryTruck01Icon,
	Tag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Section } from "#/components/layout/container";
import { site } from "#/data/site";
import { formatPriceCompact } from "#/lib/price";

type HowItWorksProps = {
	/** How many wholesale warehouses the last check covered. */
	warehouses: number;
};

/** Three plain-language steps; every number comes from the site config or the stats. */
export function HowItWorks({ warehouses }: HowItWorksProps) {
	const steps = [
		{
			icon: Clock01Icon,
			title: "We check the stores",
			body: `Every morning at ${site.priceCheckTime} we compare prices${
				warehouses > 0 ? ` across ${warehouses} wholesale warehouses` : ""
			}.`,
		},
		{
			icon: Tag01Icon,
			title: "We rank the real drops",
			body: "Only in-stock products that are cheaper than before make the list, biggest discount first.",
		},
		{
			icon: DeliveryTruck01Icon,
			title: "You pay the lowest price",
			body: `Each product shows the cheapest price we found. Delivery in ${site.delivery.region}, free over ${formatPriceCompact(site.delivery.freeFrom)}.`,
		},
	];

	return (
		<Section className="bg-muted/50 py-14">
			<h2 className="type-display text-3xl md:text-4xl">How it works</h2>

			<ol className="mt-8 grid gap-8 md:grid-cols-3">
				{steps.map((step, i) => (
					<li key={step.title}>
						<div className="flex items-center gap-3">
							<span className="type-num text-5xl text-brand [-webkit-text-stroke:1px_var(--foreground)]">
								{String(i + 1).padStart(2, "0")}
							</span>
							<HugeiconsIcon icon={step.icon} size={22} />
						</div>
						<h3 className="mt-3 font-semibold text-lg">{step.title}</h3>
						<p className="mt-1 text-muted-foreground">{step.body}</p>
					</li>
				))}
			</ol>
		</Section>
	);
}
