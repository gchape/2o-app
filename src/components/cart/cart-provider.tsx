import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sumBy } from "es-toolkit";
import React, { type ReactNode } from "react";
import { toast } from "sonner";
import {
	addItemFn,
	clearCartFn,
	getCartFn,
	setQuantityFn,
} from "#/lib/cart.functions";
import type { CartItem } from "#/lib/cart.types";

export const cartKeys = {
	all: ["cart"] as const,
	add: ["cart", "add"] as const,
};

type CartApiValue = {
	addItem: (sku: string) => void;
	setQuantity: (sku: string, quantity: number) => void;
	removeItem: (sku: string) => void;
	clear: () => void;
	setOpen: (open: boolean) => void;
};

type CartStateValue = {
	items: CartItem[];
	count: number;
	subtotal: number;
	currency: string;
	isOpen: boolean;
};

const CartApiContext = React.createContext<CartApiValue | null>(null);
const CartStateContext = React.createContext<CartStateValue | null>(null);

export function formatPrice(amount: number, currency = "GEL") {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		currencyDisplay: "narrowSymbol",
	}).format(amount / 100);
}

export function CartProvider({ children }: { children: ReactNode }) {
	const [isOpen, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const { data: items = [] } = useQuery({
		queryKey: cartKeys.all,
		queryFn: () => getCartFn(),
	});

	const refetchCart = () =>
		queryClient.invalidateQueries({ queryKey: cartKeys.all });

	const onError = () =>
		toast.error("Couldn't update your cart. Please try again.");

	const { mutate: addItem } = useMutation({
		mutationKey: cartKeys.add,
		mutationFn: (sku: string) => addItemFn({ data: { sku } }),
		onError,
		onSettled: async (_data, error) => {
			await refetchCart();
			if (!error) setOpen(true);
		},
	});

	const { mutate: setQty } = useMutation({
		mutationFn: (variables: { sku: string; quantity: number }) =>
			setQuantityFn({ data: variables }),
		onError,
		onSettled: refetchCart,
	});

	const { mutate: clear } = useMutation({
		mutationFn: () => clearCartFn(),
		onError,
		onSettled: refetchCart,
	});

	const api = React.useMemo<CartApiValue>(
		() => ({
			addItem,
			setQuantity: (sku, quantity) => setQty({ sku, quantity }),
			removeItem: (sku) => setQty({ sku, quantity: 0 }),
			clear: () => clear(),
			setOpen,
		}),
		[addItem, setQty, clear],
	);

	const state = React.useMemo<CartStateValue>(
		() => ({
			items,
			count: sumBy(items, (i) => i.quantity),
			subtotal: sumBy(items, (i) => i.price * i.quantity),
			currency: items[0]?.currency ?? "GEL",
			isOpen,
		}),
		[items, isOpen],
	);

	return (
		<CartApiContext value={api}>
			<CartStateContext value={state}>{children}</CartStateContext>
		</CartApiContext>
	);
}

export function useCartApi() {
	const ctx = React.useContext(CartApiContext);
	if (!ctx) throw new Error("useCartApi must be used inside <CartProvider>");
	return ctx;
}

export function useCartState() {
	const ctx = React.useContext(CartStateContext);
	if (!ctx) throw new Error("useCartState must be used inside <CartProvider>");
	return ctx;
}
