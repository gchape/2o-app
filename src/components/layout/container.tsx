import type { ComponentProps } from "react";
import { cn } from "#/lib/utils";

/** Centers content in the site's standard content column. */
export function Container({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10",
				className,
			)}
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
	spacing = "standard",
	...props
}: ComponentProps<"section"> & { spacing?: "standard" | "compact" | "none" }) {
	return (
		<section
			className={cn(
				spacing === "standard" && "py-16 md:py-24",
				spacing === "compact" && "py-12 md:py-16",
				className,
			)}
			{...props}
		>
			<Container>{children}</Container>
		</section>
	);
}
