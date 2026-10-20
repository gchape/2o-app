import React, { type ReactNode } from "react";

export type CartItem = {
	id: string;
	name: string;
	price: number;
	image: string;
	quantity: number;
};

type NewItem = Omit<CartItem, "quantity">;

type Action =
	| { type: "add"; item: NewItem }
	| { type: "setQuantity"; id: string; quantity: number }
	| { type: "remove"; id: string }
	| { type: "clear" };

function reducer(state: CartItem[], action: Action): CartItem[] {
	switch (action.type) {
		case "add": {
			const exists = state.some((i) => i.id === action.item.id);
			if (exists) {
				return state.map((i) =>
					i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i,
				);
			}
			return [...state, { ...action.item, quantity: 1 }];
		}
		case "setQuantity":
			if (action.quantity <= 0) {
				return state.filter((i) => i.id !== action.id);
			}
			return state.map((i) =>
				i.id === action.id ? { ...i, quantity: action.quantity } : i,
			);
		case "remove":
			return state.filter((i) => i.id !== action.id);
		case "clear":
			return [];
	}
}

type CartApiValue = {
	addItem: (item: NewItem) => void;
	setQuantity: (id: string, quantity: number) => void;
	removeItem: (id: string) => void;
	clear: () => void;
	setOpen: (open: boolean) => void;
};

type CartStateValue = {
	items: CartItem[];
	count: number;
	subtotal: number;
	isOpen: boolean;
};

const CartApiContext = React.createContext<CartApiValue | null>(null);
const CartStateContext = React.createContext<CartStateValue | null>(null);

export function formatPrice(amount: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(amount);
}

export function CartProvider({ children }: { children: ReactNode }) {
	const [items, dispatch] = React.useReducer(reducer, []);
	const [isOpen, setOpen] = React.useState(false);

	const addItem = React.useCallback(
		(item: NewItem) => dispatch({ type: "add", item }),
		[],
	);

	const setQuantity = React.useCallback(
		(id: string, quantity: number) =>
			dispatch({ type: "setQuantity", id, quantity }),
		[],
	);

	const removeItem = React.useCallback(
		(id: string) => dispatch({ type: "remove", id }),
		[],
	);

	const clear = React.useCallback(() => dispatch({ type: "clear" }), []);

	const api = React.useMemo<CartApiValue>(
		() => ({ addItem, setQuantity, removeItem, clear, setOpen }),
		[addItem, setQuantity, removeItem, clear],
	);

	const state = React.useMemo<CartStateValue>(
		() => ({
			items,
			count: items.reduce((n, i) => n + i.quantity, 0),
			subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
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
