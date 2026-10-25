import { queryOptions } from "@tanstack/react-query";
import { getStatsFn } from "./stats.functions";

export const statsQuery = queryOptions({
	queryKey: ["stats"],
	queryFn: ({ signal }) => getStatsFn({ signal }),
	staleTime: 5 * 60_000,
});
