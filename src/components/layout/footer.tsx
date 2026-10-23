import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { departmentSlugs, departments } from "#/data/catalog";
import { site } from "#/data/site";
import { socials } from "#/data/socials";
import { Container } from "./container";
import { Logo } from "./logo";

const info = [
	"Prices checked every day",
	"Deals on shoes and clothing",
	"Men, women and kids",
];

function FooterHeading({ children }: { children: string }) {
	return (
		<h3 className="font-semibold text-brand text-sm uppercase tracking-wide">
			{children}
		</h3>
	);
}

export function Footer() {
	// Accounts without a link yet stay out of the footer.
	const links = socials.flatMap((s) =>
		s.href ? [{ ...s, href: s.href }] : [],
	);

	return (
		<footer className="bg-neutral-950 text-white">
			<Container className="grid gap-10 py-14 md:grid-cols-4">
				<div className="md:col-span-2">
					<Logo className="h-12" />
					<p className="mt-4 max-w-sm text-white/60">{site.pitch}</p>

					{links.length > 0 && (
						<ul className="mt-6 flex items-center gap-3">
							{links.map((s) => (
								<li key={s.label}>
									<a
										href={s.href}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={s.label}
										className="flex size-10 items-center justify-center rounded-full border border-white/20 text-brand transition-colors hover:border-brand hover:bg-brand hover:text-brand-foreground"
									>
										<HugeiconsIcon icon={s.icon} size={20} />
									</a>
								</li>
							))}
						</ul>
					)}
				</div>

				<div>
					<FooterHeading>Shop</FooterHeading>
					<ul className="mt-4 space-y-2">
						{departmentSlugs.map((slug) => (
							<li key={slug}>
								<Link
									to="/$department"
									params={{ department: slug }}
									className="text-white/70 transition-colors hover:text-white"
								>
									{departments[slug].label}
								</Link>
							</li>
						))}
					</ul>
				</div>

				<div>
					<FooterHeading>Good to know</FooterHeading>
					<ul className="mt-4 space-y-2 text-white/70">
						{info.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>
			</Container>

			<div className="border-white/10 border-t">
				<Container className="flex flex-col gap-2 py-6 text-white/50 text-xs md:flex-row md:justify-between">
					<p>
						© {new Date().getFullYear()} {site.name}. All rights reserved.
					</p>
					<p>
						Prices and availability can change. Brand names belong to their
						owners, and {site.name} is not affiliated with them.
					</p>
				</Container>
			</div>
		</footer>
	);
}
