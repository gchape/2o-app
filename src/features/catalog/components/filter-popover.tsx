import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTitle,
	PopoverTrigger,
} from "#/components/ui/popover";
import { useTranslation } from "#/i18n/translate";
import { cn } from "#/lib/utils";

type FilterPopoverProps = {
	label: string;
	trigger: ReactNode;
	active: boolean;
	onClear: () => void;
	children: ReactNode;
};

/** Shared trigger, accessible title, and clear action for catalog filters. */
export function FilterPopover({
	label,
	trigger,
	active,
	onClear,
	children,
}: FilterPopoverProps) {
	const t = useTranslation();
	return (
		<Popover>
			<PopoverTrigger
				render={<Button variant="outline" size="sm" />}
				className={cn("h-10 rounded-lg px-4", active && "border-foreground/40")}
			>
				{trigger}
				<HugeiconsIcon icon={ArrowDown01Icon} size={14} />
			</PopoverTrigger>
			<PopoverContent align="start">
				<PopoverTitle className="sr-only">{label}</PopoverTitle>
				{children}
				{active && (
					<Button
						variant="ghost"
						size="xs"
						className="self-start"
						onClick={onClear}
					>
						{t("Clear {{label}}", { label: label.toLowerCase() })}
					</Button>
				)}
			</PopoverContent>
		</Popover>
	);
}
