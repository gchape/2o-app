import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	applyLineChange,
	EMPTY_CART,
	type LineChange,
	summarizeCart,
} from "#/features/cart/cart";
import { addItemFn, setQuantityFn } from "#/features/cart/cart.functions";
import { cartQuery } from "#/features/cart/cart.queries";
import { cartDrawer } from "./cart-drawer.store";

/** The cart's line items plus derived count, subtotal and currency. */
export const useCart = () => {
	const { data } = useQuery({ ...cartQuery, select: summarizeCart });

	return data ?? EMPTY_CART;
};

const showCartError = () =>
	toast.error("Couldn't update your cart. Please try again.");

const useRefetchCart = () => {
	const queryClient = useQueryClient();

	return () => queryClient.invalidateQueries({ queryKey: cartQuery.queryKey });
};

/** Adds one unit of a SKU and opens the drawer after a successful update. */
export function useAddToCart() {
	const refetch = useRefetchCart();

	const { mutate, isPending } = useMutation({
		mutationFn: (sku: string) => addItemFn({ data: { sku } }),
		onError: showCartError,
		onSettled: async (_data, error) => {
			await refetch();
			if (!error) cartDrawer.actions.open();
		},
	});

	return { addItem: mutate, isAdding: isPending };
}

/** Quantity changes show up immediately and roll back if the server refuses. */
export function useCartLineActions() {
	const queryClient = useQueryClient();
	const refetch = useRefetchCart();

	const { mutate } = useMutation({
		mutationFn: (change: LineChange) => setQuantityFn({ data: change }),
		onMutate: async (change) => {
			await queryClient.cancelQueries({ queryKey: cartQuery.queryKey });
			const previous = queryClient.getQueryData(cartQuery.queryKey);
			queryClient.setQueryData(
				cartQuery.queryKey,
				(items) => items && applyLineChange(items, change),
			);
			return { previous };
		},
		onError: (_error, _change, context) => {
			if (context?.previous) {
				queryClient.setQueryData(cartQuery.queryKey, context.previous);
			}
			showCartError();
		},
		onSettled: refetch,
	});

	return {
		setQuantity: (sku: string, quantity: number) => mutate({ sku, quantity }),
		removeItem: (sku: string) => mutate({ sku, quantity: 0 }),
	};
}
