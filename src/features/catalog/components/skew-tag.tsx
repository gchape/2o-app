import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

/** The slanted yellow label used for discounts and the hero's "up to" claim. */
export function SkewTag({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-block -skew-x-12 bg-brand px-3 py-1 font-bold text-brand-foreground",
				className,
			)}
		>
			{/* Un-skew the text so only the shape is slanted. */}
			<span className="inline-block skew-x-12">{children}</span>
		</span>
	);
}
