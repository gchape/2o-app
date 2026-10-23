import { createStore, useSelector } from "@tanstack/react-store";

/**
 * UI-only state: is the cart drawer open? Everything else about the cart is
 * server state and lives in TanStack Query (see `use-cart.ts`).
 *
 * Being a plain store, it can be opened from anywhere, including mutation
 * callbacks that run outside React.
 */
export const cartDrawer = createStore<
	boolean,
	{
		open: () => void;
		close: () => void;
		set: (open: boolean) => void;
	}
>(false, ({ setState }) => ({
	open: () => setState(() => true),
	close: () => setState(() => false),
	set: (open) => setState(() => open),
}));

export const useCartDrawerOpen = () => useSelector(cartDrawer);
