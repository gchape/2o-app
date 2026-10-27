import type { ComponentProps } from "react";
import { cn } from "#/lib/utils";

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
	return (
		<p
			className={cn(
				"type-eyebrow flex items-center gap-3 text-muted-foreground before:h-0.5 before:w-6 before:shrink-0 before:bg-brand",
				className,
			)}
			{...props}
		/>
	);
}
