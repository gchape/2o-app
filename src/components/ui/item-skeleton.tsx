import { Item, ItemContent, ItemMedia } from "#/components/ui/item";
import { Skeleton } from "#/components/ui/skeleton";

/** Matches the account/session rows and the taller address rows. */
export function ItemSkeleton({ address = false }: { address?: boolean }) {
	return (
		<Item aria-hidden="true">
			<ItemMedia>
				<Skeleton
					className={address ? "size-4 rounded-md" : "size-10 rounded-md"}
				/>
			</ItemMedia>
			<ItemContent>
				<Skeleton className={address ? "h-4 w-32" : "h-4 w-20"} />
				<Skeleton className={address ? "h-3 w-48" : "h-3 w-32"} />
				{address && <Skeleton className="h-3 w-24" />}
			</ItemContent>
		</Item>
	);
}
