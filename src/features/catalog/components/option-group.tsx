import type { ReactNode } from "react";
import { FieldLegend, FieldSet } from "#/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { cn } from "#/lib/utils";

type Option = {
	value: string;
	label: string;
	soldOut?: boolean;
	ariaLabel?: string;
};

type OptionGroupProps = {
	legend: ReactNode;
	options: Option[];
	value?: string;
	/** Called with the new value, or `undefined` when the active option is toggled off. */
	onChange: (value?: string) => void;
	className?: string;
};

/** A single-choice set of toggle buttons (colors, sizes, ...). */
export function OptionGroup({
	legend,
	options,
	value,
	onChange,
	className,
}: OptionGroupProps) {
	return (
		<FieldSet>
			<FieldLegend variant="label">{legend}</FieldLegend>
			<ToggleGroup
				variant="outline"
				spacing={2}
				className={cn("flex-wrap", className)}
				value={value ? [value] : []}
				onValueChange={([next]) => onChange(next)}
			>
				{options.map((o) => (
					<ToggleGroupItem
						key={o.value}
						value={o.value}
						disabled={o.soldOut}
						aria-label={o.ariaLabel}
						className={cn(o.soldOut && "line-through")}
					>
						{o.label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</FieldSet>
	);
}
