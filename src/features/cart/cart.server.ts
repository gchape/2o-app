import { getCookie, setCookie } from "@tanstack/react-start/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { compact, keyBy } from "es-toolkit";
import { z } from "zod";
import { db } from "#/db";
import { product, skus } from "#/db/schema";
import { getRedis } from "#/server/redis.server";
import { type CartItem, MAX_QUANTITY } from "./cart";
import { CART_TTL_SECONDS, createCartStore } from "./cart-store.server";

const CART_COOKIE = "cartId";

const cookieId = () => z.uuid().safeParse(getCookie(CART_COOKIE)).data;
const keyFor = (id: string) => `cart:${id}`;

/** The visitor's cart key, creating the cart (and its cookie) on first use. */
const cartKey = () => {
	const id = cookieId() ?? crypto.randomUUID();
	setCookie(CART_COOKIE, id, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: CART_TTL_SECONDS,
		path: "/",
	});
	return keyFor(id);
};

/** In-stock SKUs, already shaped like cart lines (minus the quantity). */
const findAvailableSkus = (ids: string[]) =>
	db
		.select({
			id: skus.id,
			name: sql<string>`${product.name} || ' (' || ${skus.color} || ', ' || ${skus.size} || ')'`,
			currency: product.currency,
			image: skus.imageUrl,
			price: skus.price, // minor units
		})
		.from(skus)
		.innerJoin(product, eq(skus.productId, product.id))
		.where(and(inArray(skus.id, ids), eq(skus.inStock, true)));

const store = async () => createCartStore(await getRedis(), findAvailableSkus);

async function getCart(strict = false): Promise<CartItem[]> {
	const id = cookieId();
	const entries = id
		? Object.entries(await (await getRedis()).hGetAll(keyFor(id)))
		: [];
	if (entries.length === 0) return [];

	const available = keyBy(
		await findAvailableSkus(entries.map(([field]) => field)),
		(sku) => sku.id,
	);
	if (
		strict &&
		entries.some(
			([id, quantity]) =>
				!available[id] ||
				!Number.isInteger(Number(quantity)) ||
				Number(quantity) < 1 ||
				Number(quantity) > MAX_QUANTITY,
		)
	) {
		throw new Error(
			"Some cart items are no longer available. Please review your cart.",
		);
	}

	return compact(
		entries.map(([field, value]) => {
			const sku = available[String(field)];
			return sku && { ...sku, quantity: Number(value) };
		}),
	);
}

export const cart = {
	get: getCart,
	getForCheckout: () => getCart(true),

	async removePurchased(items: { id: string; quantity: number }[]) {
		const id = cookieId();
		if (id) await (await store()).removePurchased(keyFor(id), items);
	},

	async add(skuId: string) {
		await (await store()).add(cartKey(), skuId);
	},

	async setQuantity(skuId: string, quantity: number) {
		const id = cookieId();
		if (id) await (await store()).setQuantity(keyFor(id), skuId, quantity);
	},

	/** Empties the cart (for checkout to call once an order is placed). */
	async clear() {
		const id = cookieId();
		if (id) await (await getRedis()).del([keyFor(id)]);
	},
};
