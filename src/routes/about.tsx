import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "#/components/layout/container";
import { LinkButton } from "#/components/link-button";
import { site } from "#/data/site";
import { translate, useTranslation } from "#/i18n/translate";

const description =
	"We select US stores, filter their listings, and bring worthwhile finds together so you can spend less time searching.";
const tilePositions = [
	"top-left",
	"top-center",
	"top-right",
	"middle-left",
	"middle-center",
	"middle-right",
	"bottom-left",
	"bottom-center",
	"bottom-right",
];
const steps = [
	{
		label: "Select stores",
		title: "Good finds start at the source.",
		body: "We look for reputable US warehouses and discount stores, choosing sources with original products and quality in mind.",
		short: "Selected US stores",
		tiles: 9,
	},
	{
		label: "Filter & compare",
		title: "A little more care. A lot less noise.",
		body: "We organise product listings and compare available prices, discounts and product details to help surface worthwhile deals.",
		short: "A considered selection",
		tiles: 5,
	},
	{
		label: "Discover your find",
		title: "Your next find, in one place.",
		body: "Explore shoes and clothing by brand, size, colour and budget. We bring the selection together; you decide what works for you.",
		short: "Ready to explore",
		tiles: 3,
	},
] as const;

export const Route = createFileRoute("/about")({
	head: ({ match }) => ({
		meta: [
			{
				title: `${translate("About us", {}, match.context.locale)} | ${site.name}`,
			},
			{
				name: "description",
				content: translate(description, {}, match.context.locale),
			},
		],
	}),
	component: AboutPage,
});

function AboutPage() {
	const t = useTranslation();
	const [active, setActive] = useState(0);
	const currentStep = steps[active] ?? steps[0];
	return (
		<>
			<Section className="brand-surface text-white" spacing="none">
				<div className="grid gap-10 py-20 md:py-28 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-20 lg:py-36">
					<div>
						<p className="type-eyebrow flex items-center gap-3 text-brand">
							<span className="h-0.5 w-8 bg-brand" aria-hidden="true" />
							{t("About us")}
						</p>
						<h1 className="type-display mt-8 max-w-3xl text-5xl leading-[1.08] sm:text-6xl lg:text-7xl">
							{t("Good finds. Less searching.")}
						</h1>
					</div>
					<div className="max-w-lg">
						<p className="type-body text-lg text-white/70 md:text-xl">
							{t(description)}
						</p>
						<a
							href="#our-process"
							className="mt-8 inline-flex items-center gap-4 border-white/30 border-b pb-2 text-sm font-semibold transition-colors hover:border-brand hover:text-brand focus-visible:outline-brand focus-visible:outline-2 focus-visible:outline-offset-4"
						>
							{t("See how we choose")} <span aria-hidden="true">↓</span>
						</a>
					</div>
				</div>
			</Section>
			<Section
				id="our-process"
				className="scroll-mt-28 overflow-hidden bg-background"
			>
				<div className="mb-12 max-w-2xl md:mb-16">
					<p className="type-eyebrow text-muted-foreground">
						{t("Our process")}
					</p>
					<h2 className="type-display mt-4 text-3xl leading-tight md:text-5xl">
						{t("From the source to your shortlist.")}
					</h2>
				</div>
				<div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
					<fieldset
						className="min-w-0 space-y-3"
						aria-label={t("Explore our process")}
					>
						{steps.map((step, index) => (
							<button
								key={step.label}
								type="button"
								aria-pressed={active === index}
								aria-controls="about-step"
								onClick={() => setActive(index)}
								className={`flex w-full items-start gap-5 rounded-2xl border p-5 text-left transition-colors md:p-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${active === index ? "border-brand bg-brand/10" : "border-border hover:bg-muted/50"}`}
							>
								<span
									className={`type-num flex size-10 shrink-0 items-center justify-center rounded-full text-sm ${active === index ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"}`}
								>
									{String(index + 1).padStart(2, "0")}
								</span>
								<span>
									<span className="block text-lg font-semibold">
										{t(step.label)}
									</span>
									<span className="mt-2 block text-sm leading-7 text-muted-foreground">
										{t(step.body)}
									</span>
								</span>
							</button>
						))}
					</fieldset>
					<div className="about-visual rounded-3xl border p-5 sm:p-8">
						<div className="about-scene" aria-hidden="true">
							<div className="about-stack">
								{steps.map((step, index) => (
									<div
										key={step.label}
										className="about-layer"
										data-active={active === index}
										style={{ transform: `translateZ(${index * 68}px)` }}
									>
										<div className="flex items-center justify-between gap-3 text-xs font-semibold">
											<span>{t(step.short)}</span>
											<span>0{index + 1}</span>
										</div>
										<div className="mt-5 grid grid-cols-3 gap-3">
											{tilePositions.slice(0, step.tiles).map((position) => (
												<span key={position} className="about-tile" />
											))}
										</div>
									</div>
								))}
							</div>
						</div>
						<div
							id="about-step"
							aria-live="polite"
							aria-atomic="true"
							className="relative min-h-28 border-t pt-6"
						>
							<p className="type-eyebrow text-muted-foreground">
								{t(currentStep.short)}
							</p>
							<h3 className="mt-3 text-xl font-semibold">
								{t(currentStep.title)}
							</h3>
						</div>
					</div>
				</div>
			</Section>
			<Section className="border-t bg-muted/35">
				<div className="grid gap-8 md:grid-cols-2 md:gap-20">
					<div>
						<p className="type-eyebrow text-muted-foreground">
							{t("You make the final call")}
						</p>
						<h2 className="type-display mt-4 max-w-lg text-3xl leading-tight md:text-5xl">
							{t("Better informed. Your choice.")}
						</h2>
					</div>
					<div>
						<p className="type-body text-lg text-muted-foreground">
							{t(
								"We show recorded prices and when they were checked. Prices and availability can change, so review the product details and your final total before ordering.",
							)}
						</p>
						<LinkButton to="/deals" size="lg" className="mt-8">
							{t("Explore deals")}
						</LinkButton>
					</div>
				</div>
			</Section>
		</>
	);
}
