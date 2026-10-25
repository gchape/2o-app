import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

type SectionHeaderProps = {
	title: ReactNode;
	eyebrow?: string;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
};

/** Shared heading rhythm for homepage and content sections. */
export function SectionHeader({
	title,
	eyebrow,
	description,
	action,
	className,
}: SectionHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-end justify-between gap-4",
				className,
			)}
		>
			<div className="max-w-2xl">
				{eyebrow && (
					<p className="type-eyebrow mb-3 flex items-center gap-2 text-muted-foreground before:h-1 before:w-5 before:rounded-full before:bg-brand">
						{eyebrow}
					</p>
				)}
				<h2 className="type-title text-[clamp(1.875rem,3.2vw,2.75rem)]">
					{title}
				</h2>
				{description && (
					<p className="type-body mt-3 max-w-xl text-base text-muted-foreground">
						{description}
					</p>
				)}
			</div>
			{action}
		</div>
	);
}
