import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { Section } from "#/components/layout/container";
import {
	categories,
	categorySlugs,
	type Department,
	departmentSlugs,
	departments,
} from "#/data/catalog";
import { cn } from "#/lib/utils";

/** One colour per department; a new department fails to compile until it has one. */
const tones = {
	men: "bg-neutral-950 text-white",
	women: "bg-brand text-brand-foreground",
	kids: "bg-neutral-100 text-neutral-950",
} satisfies Record<Department, string>;

/** Big typographic tiles: the whole tile opens the department, the chips jump to a category. */
export function DepartmentTiles() {
	return (
		<Section className="py-12">
			<h2 className="type-display text-3xl md:text-4xl">Shop by department</h2>
			<p className="mt-2 text-muted-foreground">
				Shoes and clothing for the whole family.
			</p>

			<ul className="mt-8 grid gap-4 md:grid-cols-3">
				{departmentSlugs.map((slug) => (
					<li
						key={slug}
						className={cn(
							"group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-2xl p-6 md:min-h-72",
							tones[slug],
						)}
					>
						<span
							aria-hidden
							className="absolute -right-6 -bottom-8 h-48 w-28 -skew-x-12 bg-current/5 transition-transform duration-300 group-hover:-translate-x-3"
						/>

						<h3 className="type-display text-5xl md:text-6xl">
							<Link
								to="/$department"
								params={{ department: slug }}
								className="after:absolute after:inset-0"
							>
								{departments[slug].label}
							</Link>
						</h3>

						<div className="relative flex items-end justify-between gap-4">
							<ul className="flex flex-wrap gap-2">
								{categorySlugs.map((category) => (
									<li key={category}>
										<Link
											to="/$department/$category"
											params={{ department: slug, category }}
											className="relative z-10 block rounded-full bg-current/10 px-3 py-1 font-medium text-sm hover:bg-current/20"
										>
											{categories[category].label}
										</Link>
									</li>
								))}
							</ul>
							<HugeiconsIcon
								icon={ArrowUpRight01Icon}
								size={28}
								className="shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
							/>
						</div>
					</li>
				))}
			</ul>
		</Section>
	);
}
