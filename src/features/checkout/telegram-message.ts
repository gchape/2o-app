import type { CheckoutAddress, CheckoutQuote } from "./checkout";

const escapeHtml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
const usd = (cents: number) => `$${(cents / 100).toFixed(2)} USD`;
export type OrderNotice = {
	id: string;
	name: string;
	email: string;
	createdAt: Date;
	quote: CheckoutQuote;
	address: CheckoutAddress;
};

/** Keep chunks below Telegram's 4096-character limit without splitting HTML entities. */
export function orderMessages(order: OrderNotice) {
	const { quote: q, address: a } = order;
	const blocks = [
		`<b>🛍 New 2o order</b>\n<code>${escapeHtml(order.id)}</code>\n<b>Payment awaiting verification</b>`,
		`<b>Customer</b>\n${escapeHtml(order.name)}\n${escapeHtml(order.email)}\n${escapeHtml(order.createdAt.toISOString())}`,
		`<b>U.S. delivery</b>\n${[a.fullName, a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`, "United States", a.phone].filter(Boolean).map(escapeHtml).join("\n")}`,
		"<b>Items</b>",
		...q.lines.map(
			(line, i) =>
				`${i + 1}. ${escapeHtml(line.name.slice(0, 400))}\n${line.quantity} × ${usd(line.usdPrice)} = <b>${usd(line.usdTotal)}</b>\nSKU: <code>${escapeHtml(line.id)}</code>`,
		),
		`<b>Price breakdown</b>\nItems: ${usd(q.subtotalUsd)}\nService fee (${q.pricing.serviceFeeBps / 100}%): ${usd(q.serviceFeeUsd)}\nU.S. shipping: ${q.shippingUsd ? usd(q.shippingUsd) : "FREE"}\n<b>Total: ${usd(q.totalUsd)}</b>\nBank transfer: ${(q.paymentTotal / 100).toFixed(2)} ${q.pricing.paymentCurrency}\nRate: 1 USD = ${q.pricing.gelPerUsd} GEL\nRate updated: ${escapeHtml(q.pricing.rateUpdatedAt)}\n\nVerify the bank deposit before marking this order paid.`,
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
