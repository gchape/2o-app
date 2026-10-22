import { Link } from "@tanstack/react-router";
import { capitalize } from "es-toolkit";
import { departmentSlugs, images } from "#/data/departments";

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
				{departmentSlugs.map((slug) => (
					<Link
						key={slug}
						to="/$department"
						params={{ department: slug }}
						className="group relative aspect-3/5 overflow-hidden rounded-xl"
					>
						<img
							src={images[slug]}
							alt=""
							className="size-full object-center transition-transform duration-300 group-hover:scale-105"
						/>
						<div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
						<span className="absolute bottom-4 left-4 font-semibold text-2xl text-white">
							{capitalize(slug)}
						</span>
					</Link>
				))}
			</div>
		</section>
	);
}
