import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { Section } from "#/components/layout/container";
import { SectionHeader } from "#/components/layout/section-header";
import {
	categories,
	categorySlugs,
	type Department,
	departmentSlugs,
	departments,
} from "#/data/catalog";
import { useTranslation } from "#/i18n/translate";
import { cn } from "#/lib/utils";

/** One colour per department; a new department fails to compile until it has one. */
const tones = {
	men: "bg-neutral-950 text-white",
	women: "bg-brand text-brand-foreground",
	kids: "bg-neutral-100 text-neutral-950",
} satisfies Record<Department, string>;

/** Big typographic tiles: the whole tile opens the department, the chips jump to a category. */
export function DepartmentTiles() {
	const t = useTranslation();
	return (
		<Section className="pt-4 md:pt-2">
			<SectionHeader
				title={t("Shop by department")}
				description={t("Shoes and clothing for the whole family.")}
			/>

			<ul className="mt-8 grid gap-5 md:mt-10 md:grid-cols-3 md:gap-6">
				{departmentSlugs.map((slug) => (
					<li
						key={slug}
						className={cn(
							"group relative flex min-h-56 flex-col justify-between overflow-hidden rounded-xl p-7 md:min-h-80 lg:p-9",
							tones[slug],
						)}
					>
						<span
							aria-hidden
							className="absolute -right-6 -bottom-8 h-48 w-28 -skew-x-12 bg-current/5 transition-transform duration-300 group-hover:-translate-x-3"
						/>

						<h3 className="type-title text-3xl sm:text-4xl lg:text-5xl">
							<Link
								to="/$department/{-$category}"
								params={{ department: slug, category: undefined }}
								className="after:absolute after:inset-0"
							>
								{t(departments[slug].label)}
							</Link>
						</h3>

						<div className="relative flex items-end justify-between gap-4">
							<ul className="flex flex-wrap gap-2">
								{categorySlugs.map((category) => (
									<li key={category}>
										<Link
											to="/$department/{-$category}"
											params={{ department: slug, category }}
											className="relative z-10 block rounded-full bg-current/10 px-4 py-2 font-medium text-sm hover:bg-current/20"
										>
											{t(categories[category].label)}
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
