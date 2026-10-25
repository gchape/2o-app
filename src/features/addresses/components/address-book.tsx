import { useAuth, useSession } from "@better-auth-ui/react";
import { Add01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#/components/ui/empty";
import { ItemGroup, ItemSeparator } from "#/components/ui/item";
import { ItemSkeleton } from "#/components/ui/item-skeleton";
import { useTranslation } from "#/i18n/translate";
import { cn } from "#/lib/utils";
import { addressesQuery } from "../address.queries";
import { MAX_ADDRESSES } from "../address.schema";
import { AddressDialog } from "./address-dialog";
import { AddressRow } from "./address-row";

export type AddressBookProps = {
	className?: string;
};

/** Saved delivery addresses in account settings. */
export function AddressBook({ className }: AddressBookProps) {
	const t = useTranslation();
	const { authClient } = useAuth();
	const { data: session } = useSession(authClient);
	const {
		data: addresses,
		isPending,
		isError,
		isFetching,
		refetch,
	} = useQuery(addressesQuery(session?.user.id));
	const [adding, setAdding] = useState(false);

	const count = addresses?.length ?? 0;
	const atLimit = count >= MAX_ADDRESSES;

	return (
		<div>
			<div className="mb-3 flex items-center justify-between gap-2">
				<h2 className="text-sm font-semibold">{t("Addresses")}</h2>

				{count > 0 && (
					<Button
						variant="outline"
						size="sm"
						disabled={atLimit}
						onClick={() => setAdding(true)}
					>
						<HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
						{t("Add address")}
					</Button>
				)}
			</div>

			<Card className={cn("gap-0 p-0", className)}>
				<CardContent className="p-0">
					{isPending ? (
						<ItemSkeleton address />
					) : isError ? (
						<div className="flex flex-col items-start gap-3 p-4">
							<p role="alert" className="text-destructive text-sm">
								{t("Couldn't load your addresses.")}
							</p>
							<Button
								variant="outline"
								size="sm"
								disabled={isFetching}
								onClick={() => refetch()}
							>
								{isFetching ? t("Trying again…") : t("Try again")}
							</Button>
						</div>
					) : addresses.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<HugeiconsIcon icon={Location01Icon} />
								</EmptyMedia>
								<EmptyTitle>{t("No saved addresses")}</EmptyTitle>
								<EmptyDescription>
									{t("Save and manage your delivery addresses.")}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button size="sm" onClick={() => setAdding(true)}>
									<HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
									{t("Add address")}
								</Button>
							</EmptyContent>
						</Empty>
					) : (
						<ItemGroup className="gap-0!">
							{addresses.map((address, index) => (
								<Fragment key={address.id}>
									{index > 0 && <ItemSeparator className="my-0!" />}
									<AddressRow
										address={address}
										isOnly={addresses.length === 1}
									/>
								</Fragment>
							))}
						</ItemGroup>
					)}
				</CardContent>

				{count > 0 && (
					<p className="border-t p-4 text-muted-foreground text-xs">
						{atLimit
							? t(
									"You've saved the most addresses allowed ({{max}}). Delete one to add another.",
									{ max: MAX_ADDRESSES },
								)
							: t("Your primary address is your default delivery address.")}
					</p>
				)}
			</Card>

			<AddressDialog
				open={adding}
				onOpenChange={setAdding}
				firstAddress={count === 0}
			/>
		</div>
	);
}
