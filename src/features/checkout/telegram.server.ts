import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "#/db";
import { checkoutSession, orderNotification, orders } from "#/db/schema";
import { env } from "#/server/env.server";
import { orderMessages } from "./telegram-message";

async function telegram(
	method: string,
	body: FormData | Record<string, unknown>,
) {
	const isForm = body instanceof FormData;
	const response = await fetch(
		`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,
		{
			method: "POST",
			body: isForm ? body : JSON.stringify(body),
			headers: isForm ? undefined : { "Content-Type": "application/json" },
			signal: AbortSignal.timeout(15_000),
		},
	);
	const result: unknown = await response.json();
	if (
		!response.ok ||
		typeof result !== "object" ||
		result === null ||
		!("ok" in result) ||
		result.ok !== true
	)
		throw new Error("Telegram rejected notification");
}

/** Durable at-least-once delivery; progress is saved after each accepted message. */
export async function deliverOrderNotification(orderId?: string) {
	if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;
	const job = await db.transaction(async (tx) => {
		const now = new Date();
		const [pending] = await tx
			.select()
			.from(orderNotification)
			.where(
				and(
					isNull(orderNotification.sentAt),
					lt(orderNotification.nextAttemptAt, now),
					or(
						isNull(orderNotification.leaseUntil),
						lt(orderNotification.leaseUntil, now),
					),
					orderId ? eq(orderNotification.orderId, orderId) : undefined,
				),
			)
			.orderBy(orderNotification.nextAttemptAt)
			.limit(1)
			.for("update", { skipLocked: true });
		if (!pending) return null;
		await tx
			.update(orderNotification)
			.set({
				leaseUntil: new Date(Date.now() + 10 * 60_000),
				attempts: pending.attempts + 1,
			})
			.where(eq(orderNotification.orderId, pending.orderId));
		return pending;
	});
	if (!job) return false;
	try {
		const [order] = await db
			.select()
			.from(orders)
			.where(eq(orders.id, job.orderId));
		const [draft] = await db
			.select()
			.from(checkoutSession)
			.where(eq(checkoutSession.id, job.orderId));
		if (!order?.checkoutQuote || !draft?.proofBase64 || !draft.proofType)
			throw new Error("Missing order snapshot");
		const messages = orderMessages({
			id: order.id,
			name: order.customerName ?? "",
			email: order.customerEmail ?? "",
			createdAt: order.createdAt,
			quote: order.checkoutQuote,
			address: draft.shippingAddress,
		});
		for (let i = job.nextMessage; i < messages.length; i++) {
			await telegram("sendMessage", {
				chat_id: env.TELEGRAM_CHAT_ID,
				text: messages[i],
				parse_mode: "HTML",
				link_preview_options: { is_disabled: true },
			});
			await db
				.update(orderNotification)
				.set({ nextMessage: i + 1 })
				.where(eq(orderNotification.orderId, job.orderId));
		}
		if (!job.proofSent) {
			const file = new FormData();
			file.set("chat_id", env.TELEGRAM_CHAT_ID);
			file.set(
				"caption",
				`Payment proof — order ${order.id}\nAwaiting bank verification`,
			);
			const extension =
				draft.proofType === "image/png"
					? "png"
					: draft.proofType === "image/jpeg"
						? "jpg"
						: "webp";
			file.set(
				"document",
				new Blob([Buffer.from(draft.proofBase64, "base64")], {
					type: draft.proofType,
				}),
				`payment-${order.id}.${extension}`,
			);
			await telegram("sendDocument", file);
			await db
				.update(orderNotification)
				.set({ proofSent: true })
				.where(eq(orderNotification.orderId, job.orderId));
		}
		await db
			.update(orderNotification)
			.set({ sentAt: new Date(), leaseUntil: null })
			.where(eq(orderNotification.orderId, job.orderId));
	} catch {
		// Do not log fetch errors: they can contain the bot token in the request URL.
		console.error("Telegram notification will be retried", {
			orderId: job.orderId,
		});
		await db
			.update(orderNotification)
			.set({
				leaseUntil: null,
				nextAttemptAt: new Date(
					Date.now() +
						Math.min(3600, 30 * 2 ** Math.min(job.attempts, 7)) * 1000,
				),
			})
			.where(eq(orderNotification.orderId, job.orderId));
	}
	return true;
}

export async function cleanExpiredDrafts() {
	// Never discard a submitted order or payment evidence.
	await db
		.delete(checkoutSession)
		.where(
			and(
				isNull(checkoutSession.submittedAt),
				isNull(checkoutSession.proofBase64),
				lt(checkoutSession.expiresAt, sql`now() - interval '30 days'`),
			),
		);
}
