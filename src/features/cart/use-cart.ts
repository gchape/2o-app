import {
	useIsMutating,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
	applyLineChange,
	EMPTY_CART,
	type LineChange,
	summarizeCart,
} from "#/features/cart/cart";
import { addItemFn, setQuantityFn } from "#/features/cart/cart.functions";
import { cartQuery } from "#/features/cart/cart.queries";
import { useTranslation } from "#/i18n/translate";
import { CART_MUTATION_KEY, cartMutationOptions } from "./cart.mutations";
import { cartDrawer } from "./cart-drawer.store";

export const useCartUpdating = () =>
	useIsMutating({ mutationKey: CART_MUTATION_KEY }) > 0;

/** The cart's line items plus derived count, subtotal and currency. */
export const useCart = () => {
	const { data, isPending, isError, isFetching, refetch } = useQuery({
		...cartQuery,
		select: summarizeCart,
	});

	return { ...(data ?? EMPTY_CART), isPending, isError, isFetching, refetch };
};

const useCartError = () => {
	const t = useTranslation();
	return () => toast.error(t("Couldn't update your cart. Please try again."));
};

/** Adds one unit of a SKU and opens the drawer after a successful update. */
export function useAddToCart() {
	const showCartError = useCartError();
	const queryClient = useQueryClient();
	const addItemFnCall = useServerFn(addItemFn);
	const options = cartMutationOptions(queryClient);

	const { mutate, isPending } = useMutation({
		...options,
		mutationFn: (sku: string) => addItemFnCall({ data: { sku } }),
		onError: showCartError,
		onSettled: async (_data, error) => {
			await options.onSettled();
			if (!error) cartDrawer.actions.open();
		},
	});

	return { addItem: mutate, isAdding: isPending };
}

/** Apply confirmed changes in order, so a failed write cannot undo another line. */
export function useCartLineActions() {
	const showCartError = useCartError();
	const queryClient = useQueryClient();
	const setQuantityFnCall = useServerFn(setQuantityFn);

	const { mutate } = useMutation({
		...cartMutationOptions(queryClient),
		mutationFn: (change: LineChange) => setQuantityFnCall({ data: change }),
		onSuccess: (_data, change) => {
			queryClient.setQueryData(
				cartQuery.queryKey,
				(items) => items && applyLineChange(items, change),
			);
		},
		onError: showCartError,
	});

	return {
		setQuantity: (sku: string, quantity: number) => mutate({ sku, quantity }),
		removeItem: (sku: string) => mutate({ sku, quantity: 0 }),
	};
}
