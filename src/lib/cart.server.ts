import { getCookie, setCookie } from "@tanstack/react-start/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "#/db";
import { product, skus } from "#/db/schema";
import { valkey } from "#/lib/valkey.server";
import { type CartItem, MAX_QUANTITY } from "./cart.types";

const TTL = 60 * 60 * 24 * 30; // 30 days

function cartKey(create: true): string;
function cartKey(create?: false): string | null;
function cartKey(create = false) {
	const cartId = getCookie("cartId");
	if (cartId) return `cart:${cartId}`;
	if (!create) return null;

	const id = crypto.randomUUID();
	setCookie("cartId", id, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: TTL,
		path: "/",
	});
	return `cart:${id}`;
}

const findSkus = (ids: string[]) =>
	db
		.select({
			id: skus.id,
			name: product.name,
			currency: product.currency,
			color: skus.color,
			size: skus.size,
			image: skus.imageUrl,
			price: skus.price, // minor units
			inStock: skus.inStock,
		})
		.from(skus)
		.innerJoin(product, eq(skus.productId, product.id))
		.where(inArray(skus.id, ids));

async function assertAvailable(skuId: string) {
	const [row] = await findSkus([skuId]);
	if (!row?.inStock) throw new Error("Unavailable");
}

export const cart = {
	async get(): Promise<CartItem[]> {
		const key = cartKey();
		if (!key) return [];

		const entries = await valkey.hgetall(key);
		if (entries.length === 0) return [];

		const qty = new Map(entries.map((e) => [String(e.field), Number(e.value)]));
		const rows = await findSkus([...qty.keys()]);

		// skus deleted by a re-sync simply don't join, so they never show up
		return rows
			.filter((r) => r.inStock)
			.map((r) => ({
				id: r.id,
				name: `${r.name} (${r.color}, ${r.size})`,
				price: r.price,
				currency: r.currency,
				image: r.image,
				quantity: qty.get(r.id) ?? 1,
			}));
	},

	async add(skuId: string) {
		await assertAvailable(skuId);

		const key = cartKey(true);
		const current = Number(String((await valkey.hget(key, skuId)) ?? 0));
		if (current >= MAX_QUANTITY) throw new Error("Maximum quantity reached");

		await valkey.hincrBy(key, skuId, 1);
		await valkey.expire(key, TTL);
	},

	async setQuantity(skuId: string, quantity: number) {
		if (quantity === 0) {
			const key = cartKey();
			if (key) await valkey.hdel(key, [skuId]);
			return;
		}

		await assertAvailable(skuId);

		const key = cartKey(true);
		await valkey.hset(key, [{ field: skuId, value: String(quantity) }]);
		await valkey.expire(key, TTL);
	},

	async clear() {
		const key = cartKey();
		if (key) await valkey.del([key]);
	},
};
