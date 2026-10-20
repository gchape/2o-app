const highlights = [
	{ title: "Updated daily", text: "prices checked every morning" },
	{ title: "Up to 70% off", text: "big brands, real discounts" },
	{ title: "Whole family", text: "men, women and kids" },
];

export function TrustStrip() {
	return (
		<section className="bg-neutral-950 text-white">
			<div className="mx-auto grid max-w-6xl gap-3 px-4 py-5 text-sm sm:grid-cols-3">
				{highlights.map((h) => (
					<div key={h.title} className="flex items-center gap-3">
						<span className="size-2 shrink-0 rounded-full bg-yellow-400" />
						<p>
							<span className="font-semibold">{h.title}</span>
							<span className="text-white/60"> · {h.text}</span>
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
