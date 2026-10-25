import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#/components/ui/input-group";
import { useDebouncedCallback } from "#/hooks/use-debounced-callback";
import { useTranslation } from "#/i18n/translate";

type SearchBoxProps = {
	/** The search text currently in the URL. */
	value: string;
	/** Called shortly after typing stops, and at once on Enter or clear. */
	onCommit: (value: string) => void;
	className?: string;
};

export function SearchBox({ value, onCommit, className }: SearchBoxProps) {
	const t = useTranslation();
	const [draft, setDraft] = useState(value);
	const committed = useRef(value);

	const commit = useDebouncedCallback((next: string) => {
		committed.current = next;
		onCommit(next);
	}, 250);

	// Follow changes made elsewhere (a removed chip, "Clear all") without ever fighting the typing.
	useEffect(() => {
		if (value !== committed.current) {
			commit.cancel();
			committed.current = value;
			setDraft(value);
		}
	}, [value, commit]);

	const clear = () => {
		commit.cancel();
		committed.current = "";
		setDraft("");
		onCommit("");
	};

	return (
		<search className={className}>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					commit.flush();
				}}
			>
				<InputGroup className="h-11 min-w-0">
					<InputGroupAddon align="inline-start">
						<HugeiconsIcon icon={Search01Icon} size={16} />
					</InputGroupAddon>
					<InputGroupInput
						type="search"
						autoComplete="off"
						placeholder={t("Search shoes and clothing")}
						aria-label={t("Search products")}
						className="[&::-webkit-search-cancel-button]:hidden"
						value={draft}
						onChange={(event) => {
							setDraft(event.target.value);
							commit(event.target.value);
						}}
					/>
					{draft && (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								size="icon-xs"
								aria-label={t("Clear search")}
								onClick={clear}
							>
								<HugeiconsIcon icon={Cancel01Icon} size={14} />
							</InputGroupButton>
						</InputGroupAddon>
					)}
				</InputGroup>
			</form>
		</search>
	);
}
