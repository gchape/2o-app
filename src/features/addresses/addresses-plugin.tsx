import { lazy, Suspense } from "react";
import { Skeleton } from "#/components/ui/skeleton";
import type { AuthPlugin } from "#/lib/auth/auth-plugin";

const AddressBook = lazy(() =>
	import("./components/address-book").then((module) => ({
		default: module.AddressBook,
	})),
);

function AddressesCard() {
	return (
		<Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
			<AddressBook />
		</Suspense>
	);
}

/** Adds the address book to the account settings tab. */
export const addressesPlugin: AuthPlugin = {
	id: "addresses",
	accountCards: [AddressesCard],
};
