import { queryOptions } from "@tanstack/react-query";
import { listAddressesFn } from "./address.functions";

export const addressQueryKey = ["addresses"] as const;

export const addressesQuery = (userId: string | undefined) =>
	queryOptions({
		queryKey: [...addressQueryKey, userId],
		queryFn: ({ signal }) => listAddressesFn({ signal }),
		enabled: Boolean(userId),
	});
