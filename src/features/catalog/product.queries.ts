import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { Category, Department } from "#/data/catalog";
import { getDealsFn, getHomeDealsFn, getProductsFn } from "./product.functions";

export const homeDealsQuery = queryOptions({
	queryKey: ["home-deals"],
	queryFn: () => getHomeDealsFn(),
	staleTime: 60_000,
});

export const dealsQuery = infiniteQueryOptions({
	queryKey: ["deals"],
	queryFn: ({ pageParam }) => getDealsFn({ data: { page: pageParam } }),
	initialPageParam: 1,
	getNextPageParam: (last, _pages, lastPageParam) =>
		last.hasMore ? lastPageParam + 1 : undefined,
	staleTime: 60_000,
});

export const productsQuery = (department: Department, category?: Category) =>
	infiniteQueryOptions({
		queryKey: ["products", department, category ?? "all"],
		queryFn: ({ pageParam }) =>
			getProductsFn({ data: { department, category, page: pageParam } }),
		initialPageParam: 1,
		getNextPageParam: (last, _pages, lastPageParam) =>
			last.hasMore ? lastPageParam + 1 : undefined,
		staleTime: 60_000,
	});
