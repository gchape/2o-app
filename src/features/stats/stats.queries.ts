import { queryOptions } from "@tanstack/react-query";
import { getStatsFn } from "./stats.functions";

export const statsQuery = queryOptions({
	queryKey: ["stats"],
	queryFn: () => getStatsFn(),
	staleTime: 5 * 60_000,
});
