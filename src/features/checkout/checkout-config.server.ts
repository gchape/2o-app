import { z } from "zod";
import { env } from "#/server/env.server";
import type { CheckoutPricing } from "./checkout";

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
	CHECKOUT_BENEFICIARY: z.string().trim().min(2).max(150),
	CHECKOUT_PAYMENT_CURRENCY: z.enum(["USD", "GEL"]),
	CHECKOUT_GEL_PER_USD: z
		.string()
		.min(1)
		.pipe(z.coerce.number<string>().positive().max(100)),
	CHECKOUT_RATE_UPDATED_AT: z.iso.datetime({ offset: true }),
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

export function checkoutPricing(
	source: Record<string, unknown> = env,
	now = Date.now(),
): CheckoutPricing | null {
	const parsed = settingsSchema.safeParse(source);
	if (!parsed.success) return null;
	const e = parsed.data;
	const age = now - Date.parse(e.CHECKOUT_RATE_UPDATED_AT);
	// Explicit merchant rate, refreshed at least weekly. Never silently invent an FX rate.
	if (age < -60_000 || age > 7 * 24 * 60 * 60 * 1000) return null;
	return {
		gelPerUsd: e.CHECKOUT_GEL_PER_USD,
		rateUpdatedAt: e.CHECKOUT_RATE_UPDATED_AT,
		serviceFeeBps: e.CHECKOUT_SERVICE_FEE_BPS,
		shippingUsd: e.CHECKOUT_SHIPPING_USD_CENTS,
		paymentCurrency: e.CHECKOUT_PAYMENT_CURRENCY,
		iban: e.CHECKOUT_IBAN,
		beneficiary: e.CHECKOUT_BENEFICIARY,
	};
}
