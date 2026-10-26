import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { departmentSlugs, departments } from "#/data/catalog";
import { site } from "#/data/site";
import { socials } from "#/data/socials";
import { useTranslation } from "#/i18n/translate";
import { Container } from "./container";
import { Logo } from "./logo";

function FooterHeading({ children }: { children: string }) {
	return (
		<h3 className="font-semibold text-brand text-xs uppercase tracking-[0.16em]">
			{children}
		</h3>
	);
}

export function Footer() {
	const t = useTranslation();
	// Accounts without a link yet stay out of the footer.
	const links = socials.flatMap((s) =>
		s.href ? [{ ...s, href: s.href }] : [],
	);

	return (
		<footer className="brand-surface footer-scene text-white">
			<Container className="grid grid-cols-2 gap-x-8 gap-y-10 py-14 md:grid-cols-4 md:gap-12 md:py-18">
				<div className="col-span-2">
					<Logo className="h-10" />
					<p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
						{t(site.pitch)}
					</p>

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
					<FooterHeading>{t("Shop")}</FooterHeading>
					<ul className="mt-5 space-y-3 text-sm">
						<li>
							<Link to="/deals" className="text-white/70 hover:text-white">
								{t("All deals")}
							</Link>
						</li>
						{departmentSlugs.map((slug) => (
							<li key={slug}>
								<Link
									to="/$department/{-$category}"
									params={{ department: slug, category: undefined }}
									className="text-white/70 transition-colors hover:text-white"
								>
									{t(departments[slug].label)}
								</Link>
							</li>
						))}
					</ul>
				</div>

				<div>
					<FooterHeading>{t("Discover")}</FooterHeading>
					<ul className="mt-5 space-y-3 text-sm text-white/70">
						<li>
							<Link to="/about" className="transition-colors hover:text-white">
								{t("About us")}
							</Link>
						</li>
					</ul>
				</div>
			</Container>

			<div className="border-white/10 border-t">
				<Container className="flex flex-col gap-3 py-6 text-white/50 text-xs leading-relaxed md:flex-row md:justify-between md:gap-10">
					<p>
						© {new Date().getFullYear()} {site.name}.{" "}
						{t("All rights reserved.")}
					</p>
					<p>
						{t(
							"Prices and availability can change. Brand names belong to their owners, and {{brand}} is not affiliated with them.",
							{ brand: site.name },
						)}
					</p>
				</Container>
			</div>
		</footer>
	);
}
