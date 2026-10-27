import { sumBy } from "es-toolkit";
import { site } from "#/data/site";
import type { ItemShipping } from "#/features/shipping/shipping";

export type CartItem = {
	/** SKU id (uuid). */
	id: string;
	name: string;
	/** Unit price in minor units. */
	price: number;
	currency: string;
	image: string | null;
	quantity: number;
	/** Absent only in snapshots created before warehouse shipping. */
	shipping?: ItemShipping;
};

export const MAX_QUANTITY = 10;

/** Distinct lines one cart may hold, so a cart can't grow without bound. */
export const MAX_CART_LINES = 50;

export const summarizeCart = (items: CartItem[]) => {
	return {
		items,
		count: sumBy(items, (item) => item.quantity),
		subtotal: sumBy(items, (item) => item.price * item.quantity),
		currency: items[0]?.currency ?? site.currency,
	};
};

type CartSummary = ReturnType<typeof summarizeCart>;

export const EMPTY_CART: CartSummary = summarizeCart([]);

/** The subtotal is one number, so a cart holds a single currency. */
export const hasCurrencyConflict = (
	items: { currency: string }[],
	currency: string,
) => items.some((item) => item.currency !== currency);

export type LineChange = { sku: string; quantity: number };

/** A quantity of 0 (or less) removes the line; unknown SKUs are ignored. */
export const applyLineChange = (
	items: CartItem[],
	{ sku, quantity }: LineChange,
) =>
	quantity <= 0
		? items.filter((item) => item.id !== sku)
		: items.map((item) => (item.id === sku ? { ...item, quantity } : item));
