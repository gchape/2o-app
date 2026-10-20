const steps = [
	{
		title: "We scan wholesale stores",
		text: "Every day we check the stores that sell shoes and clothing.",
	},
	{
		title: "We find the lowest price",
		text: "Only the cheapest offer for each item makes it onto 2o.",
	},
	{
		title: "You grab the deal",
		text: "Browse by department and buy before the price changes.",
	},
];

export function HowItWorks() {
	return (
		<section className="bg-muted/50 py-16">
			<div className="mx-auto max-w-6xl px-4">
				<h2 className="font-bold text-3xl tracking-tight">How 2o works</h2>
				<div className="mt-10 grid gap-8 md:grid-cols-3">
					{steps.map((s, i) => (
						<div key={s.title}>
							<span className="flex size-10 items-center justify-center rounded-full bg-brand font-bold text-brand-foreground">
								{i + 1}
							</span>
							<h3 className="mt-4 font-semibold text-lg">{s.title}</h3>
							<p className="mt-2 text-muted-foreground">{s.text}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
