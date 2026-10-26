import { z } from "zod";
import { env } from "#/server/env.server";
import type { CheckoutPricing } from "./checkout";
import { getGelPerUsd } from "./exchange-rate.server";

export function validIban(value: string) {
	if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(value)) return false;
	const digits = `${value.slice(4)}${value.slice(0, 4)}`.replace(
		/[A-Z]/g,
		(c) => String(c.charCodeAt(0) - 55),
	);
	let remainder = 0;
	for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
	return remainder === 1;
}

const settingsSchema = z.object({
	CHECKOUT_IBAN: z
		.string()
		.transform((s) => s.replace(/\s/g, "").toUpperCase())
		.refine(validIban),
	CHECKOUT_SERVICE_FEE_BPS: z
		.string()
		.min(1)
		.pipe(z.coerce.number<string>().int().min(0).max(10000)),
	CHECKOUT_SHIPPING_USD_CENTS: z
		.string()
		.min(1)
		.pipe(z.coerce.number<string>().int().min(0).max(100000)),
	TELEGRAM_BOT_TOKEN: z.string().min(1),
	TELEGRAM_CHAT_ID: z.string().min(1),
});

/** Incomplete payment or notification settings disable new checkouts. */
export function checkoutSettings(source: Record<string, unknown> = env) {
	const parsed = settingsSchema.safeParse(source);
	if (!parsed.success) return null;
	const e = parsed.data;
	return {
		iban: e.CHECKOUT_IBAN,
		serviceFeeBps: e.CHECKOUT_SERVICE_FEE_BPS,
		shippingUsd: e.CHECKOUT_SHIPPING_USD_CENTS,
	};
}

/**
 * Resolve pricing only when creating a quote. Saved orders retain their own
 * rate and fee snapshot even after configuration changes.
 */
export async function checkoutPricing(
	source: Record<string, unknown> = env,
): Promise<CheckoutPricing | null> {
	const settings = checkoutSettings(source);
	if (!settings) return null;
	const rate = await getGelPerUsd();
	return (
		rate && { ...settings, gelPerUsd: rate.gelPerUsd, rateDate: rate.date }
	);
}
