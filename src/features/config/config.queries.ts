import { queryOptions } from "@tanstack/react-query";
import { getPublicConfigFn } from "./config.functions";

/** Runtime config never changes while the server is up, so it is cached for good. */
export const publicConfigQuery = queryOptions({
	queryKey: ["public-config"],
	queryFn: () => getPublicConfigFn(),
	staleTime: Number.POSITIVE_INFINITY,
});
