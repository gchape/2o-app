import { getCookie, setCookie } from "@tanstack/react-start/server";
import { Batch } from "@valkey/valkey-glide";
import { and, eq, inArray, sql } from "drizzle-orm";
import { compact, invariant, keyBy } from "es-toolkit";
import { z } from "zod";
import { db } from "#/db";
import { product, skus } from "#/db/schema";
import { getValkey } from "#/server/valkey.server";
import {
	type CartItem,
	hasCurrencyConflict,
	MAX_CART_LINES,
	MAX_QUANTITY,
} from "./cart";

const CART_COOKIE = "cartId";
const CART_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

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

async function getCart(): Promise<CartItem[]> {
	const id = cookieId();
	const entries = id ? await (await getValkey()).hgetall(keyFor(id)) : [];
	if (entries.length === 0) return [];

	const available = keyBy(
		await findAvailableSkus(entries.map(({ field }) => String(field))),
		(sku) => sku.id,
	);

	return compact(
		entries.map(({ field, value }) => {
			const sku = available[String(field)];
			return sku && { ...sku, quantity: Number(value) };
		}),
	);
}

export const cart = {
	get: getCart,

	async add(skuId: string) {
		const [sku] = await findAvailableSkus([skuId]);
		invariant(sku, "Unavailable");
		invariant(
			!hasCurrencyConflict(await getCart(), sku.currency),
			"A cart can only hold one currency",
		);

		const valkey = await getValkey();
		const key = cartKey();

		if (!(await valkey.hexists(key, skuId))) {
			invariant((await valkey.hlen(key)) < MAX_CART_LINES, "Cart is full");
		}

		const [quantity] =
			(await valkey.exec(
				new Batch(true).hincrBy(key, skuId, 1).expire(key, CART_TTL_SECONDS),
				true,
			)) ?? [];

		if (Number(quantity) > MAX_QUANTITY) {
			await valkey.hincrBy(key, skuId, -1);
			throw new Error("Maximum quantity reached");
		}
	},

	/**
	 * Changes a line that is already in the cart; a quantity of 0 removes it.
	 * New lines only enter through `add`, which checks the SKU is real.
	 */
	async setQuantity(skuId: string, quantity: number) {
		const id = cookieId();
		if (!id) return;

		const valkey = await getValkey();
		const key = keyFor(id);
		if (!(await valkey.hexists(key, skuId))) return;

		const batch = new Batch(true);
		if (quantity === 0) batch.hdel(key, [skuId]);
		else batch.hset(key, [{ field: skuId, value: String(quantity) }]);

		await valkey.exec(batch.expire(key, CART_TTL_SECONDS), true);
	},

	/** Empties the cart (for checkout to call once an order is placed). */
	async clear() {
		const id = cookieId();
		if (id) await (await getValkey()).del([keyFor(id)]);
	},
};
