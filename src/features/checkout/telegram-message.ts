import { escape as escapeHtml } from "es-toolkit";
import type { CheckoutAddress } from "./checkout";
import {
	restoreCheckoutQuote,
	type StoredCheckoutQuote,
} from "./checkout-quote.server";

const usd = (cents: number) => `$${(cents / 100).toFixed(2)} USD`;
export type OrderNotice = {
	id: string;
	name: string;
	email: string;
	createdAt: Date;
	quote: StoredCheckoutQuote;
	address: CheckoutAddress;
};

/** Keep chunks below Telegram's 4096-character limit without splitting HTML entities. */
export function orderMessages(order: OrderNotice) {
	const { address: a } = order;
	const q = restoreCheckoutQuote(order.quote);
	const blocks = [
		`<b>🛍 New 2o order</b>\n<code>${escapeHtml(order.id)}</code>\n<b>Payment awaiting verification</b>`,
		`<b>Customer</b>\n${escapeHtml(order.name)}\n${escapeHtml(order.email)}\n${escapeHtml(order.createdAt.toISOString())}`,
		`<b>U.S. delivery</b>\n${[a.fullName, a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`, "United States", a.phone].filter(Boolean).map(escapeHtml).join("\n")}`,
		"<b>Items</b>",
		...q.lines.map(
			(line, i) =>
				`${i + 1}. ${escapeHtml(line.name.slice(0, 400))}\n${line.quantity} × ${usd(line.usdPrice)} = <b>${usd(line.usdTotal)}</b>\nSKU: <code>${escapeHtml(line.id)}</code>`,
		),
		`<b>Price breakdown</b>\nItems: ${usd(q.subtotalUsd)}\nService fee (${q.pricing.serviceFeeBps / 100}%): ${usd(q.serviceFeeUsd)}\nU.S. shipping: ${q.shippingUsd ? usd(q.shippingUsd) : "FREE"}\n<b>Total: ${usd(q.totalUsd)}</b>\nCustomer may pay either ${usd(q.totalUsd)} or ${(q.totalGel / 100).toFixed(2)} GEL\nExchange rate at quote: 1 USD = ${q.pricing.gelPerUsd} GEL\nRate date: ${escapeHtml(q.pricing.rateDate)}\n\nVerify the bank deposit (either amount) before marking this order paid.`,
	];
	const chunks: string[] = [];
	let chunk = "";
	for (const block of blocks) {
		if (chunk.length + block.length + 2 > 3500) {
			chunks.push(chunk);
			chunk = "";
		}
		chunk += `${chunk ? "\n\n" : ""}${block}`;
	}
	if (chunk) chunks.push(chunk);
	return chunks;
}
