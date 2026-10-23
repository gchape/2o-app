import type { ComponentProps } from "react";
import { cn } from "#/lib/utils";

/** Centers content in the site's standard 6xl column. */
export function Container({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn("mx-auto w-full max-w-6xl px-4", className)}
			{...props}
		/>
	);
}

/**
 * A page section: the outer element carries the (possibly full-bleed)
 * background and vertical rhythm, the inner `Container` the column.
 */
export function Section({
	className,
	children,
	...props
}: ComponentProps<"section">) {
	return (
		<section className={className} {...props}>
			<Container>{children}</Container>
		</section>
	);
}
