import { Link } from "@tanstack/react-router";

const departments = [
	{ slug: "men", label: "Men", image: "/images/men.webp" },
	{ slug: "women", label: "Women", image: "/images/women.webp" },
	{ slug: "kids", label: "Kids", image: "/images/kids.webp" },
] as const;

export function DepartmentTiles() {
	return (
		<section className="mx-auto max-w-6xl px-4 py-12">
			<div className="mb-8 max-w-xl">
				<h2 className="font-bold text-3xl tracking-tight">
					Shop by department
				</h2>
				<p className="mt-2 text-muted-foreground">
					Pick your section and see today's lowest prices.
				</p>
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				{departments.map((d) => (
					<Link
						key={d.slug}
						to="/$department"
						params={{ department: d.slug }}
						className="group relative aspect-3/5 overflow-hidden rounded-xl"
					>
						<img
							src={d.image}
							alt=""
							className="size-full object-center transition-transform duration-300 group-hover:scale-105"
						/>
						<div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
						<span className="absolute bottom-4 left-4 font-semibold text-2xl text-white">
							{d.label}
						</span>
					</Link>
				))}
			</div>
		</section>
	);
}
