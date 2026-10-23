import { Link } from "@tanstack/react-router";
import { site } from "#/data/site";
import { cn } from "#/lib/utils";

export function Logo({ className }: { className?: string }) {
	return (
		<Link to="/" aria-label={`${site.name} home`} className="block w-fit">
			<img
				src="/images/logo.webp"
				alt={site.name}
				className={cn("w-auto", className)}
			/>
		</Link>
	);
}
