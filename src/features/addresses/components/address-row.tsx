import {
	Delete02Icon,
	Edit02Icon,
	Location01Icon,
	MoreHorizontalIcon,
	StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "#/components/ui/item";
import { Spinner } from "#/components/ui/spinner";
import { useTranslation } from "#/i18n/translate";
import { formatAddress } from "../address.format";
import type { Address } from "../address.functions";
import { useMakePrimaryAddress, useRemoveAddress } from "../use-addresses";
import { AddressDialog } from "./address-dialog";

type AddressRowProps = {
	address: Address;
	/** The only saved address, so deleting it leaves nobody to inherit the primary. */
	isOnly: boolean;
};

/** One saved address with its actions. The row owns its edit sheet and delete prompt. */
export function AddressRow({ address, isOnly }: AddressRowProps) {
	const t = useTranslation();
	const makePrimary = useMakePrimaryAddress();
	const remove = useRemoveAddress();
	const [editing, setEditing] = useState(false);
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const { street, locality } = formatAddress(address);

	return (
		<Item>
			<ItemMedia variant="icon">
				<HugeiconsIcon icon={Location01Icon} />
			</ItemMedia>

			<ItemContent>
				<ItemTitle>
					{address.fullName}
					{address.isPrimary && (
						<Badge variant="secondary">{t("Primary")}</Badge>
					)}
				</ItemTitle>
				<ItemDescription>{street}</ItemDescription>
				<ItemDescription>{locality}</ItemDescription>
				<ItemDescription>{address.phone}</ItemDescription>
			</ItemContent>

			<ItemActions>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t("Actions for {{name}}, {{street}}", {
									name: address.fullName,
									street,
								})}
							/>
						}
					>
						<HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{!address.isPrimary && (
							<DropdownMenuItem
								disabled={makePrimary.isPending}
								onClick={() => makePrimary.mutate(address.id)}
							>
								<HugeiconsIcon icon={StarIcon} />
								{t("Make primary")}
							</DropdownMenuItem>
						)}
						<DropdownMenuItem onClick={() => setEditing(true)}>
							<HugeiconsIcon icon={Edit02Icon} />
							{t("Edit")}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setConfirmingDelete(true)}
						>
							<HugeiconsIcon icon={Delete02Icon} />
							{t("Delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</ItemActions>

			<AddressDialog
				open={editing}
				onOpenChange={setEditing}
				address={address}
			/>

			<AlertDialog
				open={confirmingDelete}
				onOpenChange={(open) => !remove.isPending && setConfirmingDelete(open)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
							<HugeiconsIcon icon={Delete02Icon} />
						</AlertDialogMedia>
						<AlertDialogTitle>{t("Delete this address?")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t(
								"{{street}}, {{locality}} will be removed from your account.",
								{ street, locality },
							)}
							{address.isPrimary &&
								!isOnly &&
								t(" Your oldest remaining address becomes the primary one.")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={remove.isPending}>
							{t("Cancel")}
						</AlertDialogCancel>
						<Button
							type="button"
							variant="destructive"
							disabled={remove.isPending}
							onClick={() => remove.mutate(address.id)}
						>
							{remove.isPending && <Spinner />}
							{t("Delete address")}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Item>
	);
}
