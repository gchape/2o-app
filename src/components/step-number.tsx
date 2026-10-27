import { cn } from "#/lib/utils";

export function StepNumber({
	index,
	active = false,
}: {
	index: number;
	active?: boolean;
}) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"type-num inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sm",
				active
					? "bg-brand text-brand-foreground"
					: "bg-muted text-muted-foreground",
			)}
		>
			{String(index + 1).padStart(2, "0")}
		</span>
	);
}
