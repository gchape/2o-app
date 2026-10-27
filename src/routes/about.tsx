import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "#/components/layout/container";
import { Eyebrow } from "#/components/layout/eyebrow";
import { SectionHeader } from "#/components/layout/section-header";
import { LinkButton } from "#/components/link-button";
import { StepNumber } from "#/components/step-number";
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
			<Section className="brand-surface about-hero text-white" spacing="none">
				<div className="grid gap-10 py-20 md:py-28 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-20 lg:py-36">
					<div>
						<Eyebrow className="text-brand">{t("About us")}</Eyebrow>
						<h1 className="type-display mt-8 max-w-3xl text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.08]">
							{t("Good finds. Less searching.")}
						</h1>
					</div>
					<div className="max-w-lg border-l border-brand/50 pl-6 lg:mb-2">
						<p className="type-body text-lg text-white/80 md:text-xl">
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
				<SectionHeader
					eyebrow={t("Our process")}
					title={t("From the source to your shortlist.")}
					className="mb-10 md:mb-14"
				/>
				<div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
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
								className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-colors md:p-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current ${active === index ? "border-brand bg-brand/10" : "border-border hover:bg-muted/50"}`}
							>
								<StepNumber index={index} active={active === index} />
								<span className="flex-1 text-base font-semibold sm:text-lg">
									{t(step.label)}
								</span>
								<span aria-hidden="true" className="text-xl">
									↗
								</span>
							</button>
						))}
					</fieldset>
					<div className="about-visual min-w-0 overflow-hidden rounded-3xl border p-5 sm:p-8">
						<div
							id="about-step"
							aria-live="polite"
							aria-atomic="true"
							className="relative min-h-36 border-b pb-6"
						>
							<h3 className="type-card-title text-xl">
								{t(currentStep.title)}
							</h3>
							<p className="type-body mt-3 text-sm text-muted-foreground">
								{t(currentStep.body)}
							</p>
						</div>
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
					</div>
				</div>
			</Section>
			<Section className="border-t bg-muted/35">
				<div className="grid gap-8 md:grid-cols-2 md:gap-20">
					<SectionHeader
						eyebrow={t("You make the final call")}
						title={t("Better informed. Your choice.")}
						className="items-start"
					/>
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
