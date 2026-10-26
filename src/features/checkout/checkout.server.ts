import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "#/db";
import {
	address,
	checkoutSession,
	orderItem,
	orderNotification,
	orders,
	skus,
	user,
} from "#/db/schema";
import { cart } from "#/features/cart/cart.server";
import {
	type CheckoutView,
	QUOTE_LIFETIME_MS,
	usAddressSchema,
} from "./checkout";
import { checkoutPricing } from "./checkout-config.server";
import { calculateQuote, restoreCheckoutQuote } from "./checkout-quote.server";
import { readPaymentProof } from "./payment-proof.server";

export class CheckoutError extends Error {}
function ensure(value: unknown, message: string): asserts value {
	if (!value) throw new CheckoutError(message);
}
const mine = (userId: string, id: string) =>
	and(eq(checkoutSession.id, id), eq(checkoutSession.userId, userId));
const publicColumns = {
	id: checkoutSession.id,
	quote: checkoutSession.quote,
	address: checkoutSession.shippingAddress,
	expiresAt: checkoutSession.expiresAt,
	submittedAt: checkoutSession.submittedAt,
	proofUploaded: sql<boolean>`${checkoutSession.proofBase64} is not null`,
};

export async function getCheckout(
	userId: string,
	id: string,
): Promise<CheckoutView> {
	const [row] = await db
		.select(publicColumns)
		.from(checkoutSession)
		.where(mine(userId, id));
	ensure(row, "Checkout not found.");
	return {
		...row,
		quote: restoreCheckoutQuote(row.quote),
		expiresAt: row.expiresAt.toISOString(),
		submittedAt: row.submittedAt?.toISOString() ?? null,
	};
}

/**
 * Reusing an ID returns its frozen quote, including during a rate-service outage.
 * The account lock serializes creation and enforces the daily attempt limit.
 */
export async function prepareCheckout(
	userId: string,
	id: string,
	addressId: string,
) {
	const [already] = await db
		.select({ id: checkoutSession.id })
		.from(checkoutSession)
		.where(mine(userId, id));
	if (already) return getCheckout(userId, id);
	// Keep external HTTP requests outside the transaction's row locks.
	const pricing = await checkoutPricing();
	await db.transaction(async (tx) => {
		await tx
			.select({ id: user.id })
			.from(user)
			.where(eq(user.id, userId))
			.for("update");
		const [existing] = await tx
			.select({ id: checkoutSession.id })
			.from(checkoutSession)
			.where(mine(userId, id));
		if (existing) return;

		ensure(
			pricing,
			"Checkout is temporarily unavailable. Please try again later.",
		);
		const recent = await tx
			.select({ id: checkoutSession.id })
			.from(checkoutSession)
			.where(
				and(
					eq(checkoutSession.userId, userId),
					gt(
						checkoutSession.createdAt,
						new Date(Date.now() - QUOTE_LIFETIME_MS),
					),
				),
			);
		ensure(
			recent.length < 10,
			"Too many checkout attempts. Please try again later.",
		);
		const [saved] = await tx
			.select()
			.from(address)
			.where(and(eq(address.id, addressId), eq(address.userId, userId)));
		const destination = usAddressSchema.safeParse(
			saved && { ...saved, line2: saved.line2 ?? "" },
		);
		ensure(
			destination.success,
			"Select a valid U.S. delivery address with a ZIP code.",
		);
		const items = await cart.getForCheckout().catch(() => {
			throw new CheckoutError(
				"Some cart items are no longer available. Please review your cart.",
			);
		});
		ensure(items.length, "Your cart is empty");
		const quote = calculateQuote(items, pricing);
		await tx.insert(checkoutSession).values({
			id,
			userId,
			quote,
			shippingAddress: destination.data,
			expiresAt: new Date(Date.now() + QUOTE_LIFETIME_MS),
		});
	});
	return getCheckout(userId, id);
}

/** Accept evidence after quote expiry: the customer may already have transferred. */
export async function uploadProof(userId: string, id: string, file: File) {
	// Verify ownership before reading the file into memory.
	const current = await getCheckout(userId, id);
	ensure(!current.submittedAt, "This order has already been submitted.");
	const proof = await readPaymentProof(file).catch(() => {
		throw new CheckoutError("Use a PNG, JPEG or WebP image up to 2 MB.");
	});
	await db.transaction(async (tx) => {
		const [row] = await tx
			.select({ submittedAt: checkoutSession.submittedAt })
			.from(checkoutSession)
			.where(mine(userId, id))
			.for("update");
		ensure(row && !row.submittedAt, "This order has already been submitted.");
		await tx
			.update(checkoutSession)
			.set({ proofBase64: proof.base64, proofType: proof.type })
			.where(mine(userId, id));
	});
	return getCheckout(userId, id);
}

/** Commit the pending order and notification together; a receipt never marks it paid. */
export async function submitCheckout(userId: string, id: string) {
	const result = await db.transaction(async (tx) => {
		const [draft] = await tx
			.select()
			.from(checkoutSession)
			.where(mine(userId, id))
			.for("update");
		ensure(draft, "Checkout not found.");
		draft.quote = restoreCheckoutQuote(draft.quote);
		if (draft.submittedAt) return { created: false, lines: draft.quote.lines };
		ensure(
			draft.proofBase64 && draft.proofType,
			"Upload your payment screenshot before placing the order.",
		);
		const [customer] = await tx
			.select({ name: user.name, email: user.email })
			.from(user)
			.where(eq(user.id, userId));
		ensure(customer, "Please sign in to continue.");
		const placedAt = new Date();
		await tx.insert(orders).values({
			id: draft.id,
			userId,
			status: "pending",
			currency: "USD",
			total: draft.quote.totalUsd,
			shippingAddress: draft.shippingAddress,
			checkoutQuote: draft.quote,
			customerName: customer.name,
			customerEmail: customer.email,
			createdAt: placedAt,
		});
		// Preserve the purchased snapshot even if a catalog SKU has since been removed.
		const availableSkus = await tx
			.select({ id: skus.id, color: skus.color, size: skus.size })
			.from(skus)
			.where(
				inArray(
					skus.id,
					draft.quote.lines.map((line) => line.id),
				),
			)
			.for("key share");
		const skuById = new Map(availableSkus.map((sku) => [sku.id, sku]));
		await tx.insert(orderItem).values(
			draft.quote.lines.map((line) => {
				const sku = skuById.get(line.id);
				return {
					orderId: id,
					skuId: sku?.id ?? null,
					name: line.name,
					price: line.usdPrice,
					quantity: line.quantity,
					imageUrl: line.image,
					color: sku?.color,
					size: sku?.size,
				};
			}),
		);
		await tx.insert(orderNotification).values({ orderId: id });
		await tx
			.update(checkoutSession)
			.set({ submittedAt: placedAt })
			.where(mine(userId, id));
		return { created: true, lines: draft.quote.lines };
	});
	if (result.created) {
		try {
			await cart.removePurchased(result.lines);
		} catch {
			console.error("Order saved; cart cleanup needs retry", { orderId: id });
		}
	}
	return getCheckout(userId, id);
}
