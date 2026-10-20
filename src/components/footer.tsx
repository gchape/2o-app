import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { departments, socials } from "#/lib/site";

const info = [
	"Prices checked every day",
	"Deals on shoes and clothing",
	"Men, women and kids",
];

export function Footer() {
	return (
		<footer className="bg-neutral-950 text-white">
			<div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
				<div className="md:col-span-2">
					<Link to="/" className="font-bold text-2xl">
						2o
					</Link>
					<p className="mt-3 max-w-sm text-white/60">
						We check wholesale stores every day and show you the cheapest deals
						on shoes and clothing for the whole family.
					</p>

					<ul className="mt-6 flex items-center gap-3">
						{socials.map((s) => (
							<li key={s.label}>
								<a
									href={s.href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={s.label}
									className="flex size-10 items-center justify-center rounded-full border border-white/20 text-brand transition-colors hover:border-yellow-400 hover:bg-yellow-400 hover:text-black"
								>
									<HugeiconsIcon icon={s.icon} size={20} />
								</a>
							</li>
						))}
					</ul>
				</div>

				<div>
					<h3 className="font-semibold text-sm text-yellow-400 uppercase tracking-wide">
						Shop
					</h3>
					<ul className="mt-4 space-y-2">
						{departments.map((d) => (
							<li key={d.slug}>
								<Link
									to="/$department"
									params={{ department: d.slug }}
									className="text-white/70 transition-colors hover:text-white"
								>
									{d.label}
								</Link>
							</li>
						))}
					</ul>
				</div>

				<div>
					<h3 className="font-semibold text-sm text-yellow-400 uppercase tracking-wide">
						Good to know
					</h3>
					<ul className="mt-4 space-y-2 text-white/70">
						{info.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>
			</div>

			<div className="border-white/10 border-t">
				<div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-white/50 text-xs md:flex-row md:justify-between">
					<p>© {new Date().getFullYear()} 2o. All rights reserved.</p>
					<p>
						Prices and availability can change. Brand names belong to their
						owners, and 2o is not affiliated with them.
					</p>
				</div>
			</div>
		</footer>
	);
}
