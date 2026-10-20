import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";

export function ClosingBanner() {
	return (
		<section className="mx-auto max-w-6xl px-4 py-16">
			<div className="rounded-2xl bg-neutral-950 px-8 py-12 text-center text-white">
				<h2 className="font-bold text-3xl tracking-tight md:text-4xl">
					New deals every day
				</h2>
				<p className="mx-auto mt-3 max-w-md text-white/70">
					Prices change daily, so the best offers don't stay for long.
				</p>
				<Button
					size="lg"
					nativeButton={false}
					className="mt-6 bg-yellow-400 text-black hover:bg-yellow-300"
					render={
						<Link to="/$department" params={{ department: "women" }}>
							Browse today's deals
						</Link>
					}
				/>
			</div>
		</section>
	);
}
