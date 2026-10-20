import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";

export function Hero() {
	return (
		<section className="relative isolate flex min-h-[75vh] items-center overflow-hidden bg-neutral-950">
			<img
				src="/images/hero.webp"
				alt=""
				className="absolute inset-0 -z-10 size-full object-cover object-right"
			/>
			<div className="absolute inset-0 -z-10 bg-linear-to-r from-black/70 via-black/30 to-transparent" />
			<div className="mx-auto w-full max-w-6xl px-4 text-white">
				<span className="inline-block rounded-full bg-brand px-4 py-1 font-bold text-brand-foreground text-sm uppercase tracking-wide">
					Up to 70% off today
				</span>
				<h1 className="mt-5 max-w-xl text-balance font-extrabold text-4xl tracking-tight md:text-6xl">
					Big brands. Small prices.
				</h1>
				<p className="mt-4 max-w-md text-lg text-white/80">
					We check wholesale stores every day and show you the cheapest deals on
					shoes and clothing for the whole family.
				</p>
				<Button
					size="lg"
					nativeButton={false}
					className="mt-8 h-12 px-8 text-base"
					render={
						<Link to="/$department" params={{ department: "women" }}>
							Shop today's deals
						</Link>
					}
				/>
			</div>
		</section>
	);
}
