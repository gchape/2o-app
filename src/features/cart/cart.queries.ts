import { queryOptions } from "@tanstack/react-query";
import { getCartFn } from "./cart.functions";

export const cartQuery = queryOptions({
	queryKey: ["cart"],
	queryFn: ({ signal }) => getCartFn({ signal }),
});
