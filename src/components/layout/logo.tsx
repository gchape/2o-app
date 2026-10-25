import { Link } from "@tanstack/react-router";
import { site } from "#/data/site";
import { useTranslation } from "#/i18n/translate";
import { cn } from "#/lib/utils";

export function Logo({ className }: { className?: string }) {
	const t = useTranslation();
	return (
		<Link
			to="/"
			aria-label={t("{{brand}} home", { brand: site.name })}
			className="block w-fit"
		>
			<img
				src="/images/logo.webp"
				alt={site.name}
				className={cn("w-auto", className)}
			/>
		</Link>
	);
}
