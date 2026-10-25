import type { QueryClient } from "@tanstack/react-query";
import { cartQuery } from "./cart.queries";

export const CART_MUTATION_KEY = ["cart", "write"] as const;

/** All writes share a queue; only the last write refreshes the server snapshot. */
export function cartMutationOptions(queryClient: QueryClient) {
	return {
		mutationKey: CART_MUTATION_KEY,
		scope: { id: "cart" },
		onMutate: () => queryClient.cancelQueries({ queryKey: cartQuery.queryKey }),
		onSettled: async () => {
			if (queryClient.isMutating({ mutationKey: CART_MUTATION_KEY }) === 1) {
				await queryClient.invalidateQueries({ queryKey: cartQuery.queryKey });
			}
		},
	};
}
