import { useId } from "react";
import { Badge } from "#/components/ui/badge";
import { Checkbox } from "#/components/ui/checkbox";
import { Label } from "#/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { cn } from "#/lib/utils";
import { FilterPopover } from "./filter-popover";

type FacetOption = { value: string; count: number };

type FacetFilterProps = {
	label: string;
	options: FacetOption[];
	selected: string[];
	onChange: (selected: string[]) => void;
	/** "list" for long lists with counts (brands); "chips" for short ones (sizes, colors). */
	layout?: "list" | "chips";
	/** Styles each option's text, e.g. "capitalize". */
	optionClassName?: string;
};

/** A filter button that opens a popover of choices; one component serves brand, size and color. */
export function FacetFilter({
	label,
	options,
	selected,
	onChange,
	layout = "list",
	optionClassName,
}: FacetFilterProps) {
	const id = useId();

	// A chosen value stays visible even when the other filters leave it with no matches.
	const shown = [
		...options,
		...selected
			.filter((value) => !options.some((option) => option.value === value))
			.map((value) => ({ value, count: 0 })),
	];
	if (shown.length === 0) return null;

	const toggle = (value: string, on: boolean) =>
		onChange(on ? [...selected, value] : selected.filter((v) => v !== value));

	return (
		<FilterPopover
			label={label}
			trigger={
				<>
					{label}
					{selected.length > 0 && <Badge>{selected.length}</Badge>}
				</>
			}
			active={selected.length > 0}
			onClear={() => onChange([])}
		>
			{layout === "chips" ? (
				<ToggleGroup
					multiple
					variant="outline"
					spacing={2}
					className="flex-wrap"
					aria-label={label}
					value={selected}
					onValueChange={onChange}
				>
					{shown.map((option) => (
						<ToggleGroupItem
							key={option.value}
							value={option.value}
							disabled={option.count === 0 && !selected.includes(option.value)}
							className={optionClassName}
						>
							{option.value}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			) : (
				<ul className="-mx-1 max-h-64 overflow-y-auto">
					{shown.map((option, index) => (
						<li
							key={option.value}
							className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted"
						>
							<Checkbox
								id={`${id}-${index}`}
								checked={selected.includes(option.value)}
								onCheckedChange={(on) => toggle(option.value, on)}
							/>
							<Label
								htmlFor={`${id}-${index}`}
								className={cn(
									"flex-1 cursor-pointer font-normal",
									optionClassName,
								)}
							>
								{option.value}
							</Label>
							<span className="text-muted-foreground text-xs tabular-nums">
								{option.count}
							</span>
						</li>
					))}
				</ul>
			)}
		</FilterPopover>
	);
}
