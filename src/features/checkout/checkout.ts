import { z } from "zod";
import { site } from "#/data/site";
import { createAddressSchema } from "#/features/addresses/address.schema";
import type { CartItem } from "#/features/cart/cart";

export const MAX_PROOF_BYTES = 2 * 1024 * 1024;
export const PROOF_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const QUOTE_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function isUsCountry(country: string) {
	return [
		"us",
		"usa",
		"united states",
		"united states of america",
		"აშშ",
		"ამერიკის შეერთებული შტატები",
	].includes(country.trim().toLowerCase());
}

export const usAddressSchema = createAddressSchema("en")
	.omit({ isPrimary: true })
	.extend({
		country: z
			.string()
			.refine(isUsCountry, "We only ship to U.S. addresses.")
			.transform(() => "US"),
		state: z
			.string()
			.trim()
			.regex(/^[A-Za-z ]{2,40}$/, "Enter a U.S. state"),
		postalCode: z
			.string()
			.trim()
			.regex(/^\d{5}(-\d{4})?$/, "Enter a valid U.S. ZIP code"),
	});
export type CheckoutAddress = z.infer<typeof usAddressSchema>;

export type CheckoutPricing = {
	gelPerUsd: number;
	rateUpdatedAt: string;
	serviceFeeBps: number;
	shippingUsd: number;
	paymentCurrency: "USD" | "GEL";
	iban: string;
	beneficiary: string;
};
export type CheckoutLine = CartItem & { usdPrice: number; usdTotal: number };
export type CheckoutQuote = {
	lines: CheckoutLine[];
	sourceCurrency: "USD" | "GEL";
	sourceSubtotal: number;
	subtotalUsd: number;
	shippingUsd: number;
	serviceFeeUsd: number;
	totalUsd: number;
	paymentTotal: number;
	pricing: CheckoutPricing;
};

/** All amounts are integer minor units. Round each USD unit price once, then multiply. */
export function calculateQuote(
	items: CartItem[],
	pricing: CheckoutPricing,
): CheckoutQuote {
	if (!items.length || items.length > 50)
		throw new Error("Your cart is empty or too large.");
	if (
		!Number.isFinite(pricing.gelPerUsd) ||
		pricing.gelPerUsd <= 0 ||
		pricing.gelPerUsd > 100
	)
		throw new Error("Invalid exchange rate");
	if (
		!Number.isSafeInteger(pricing.serviceFeeBps) ||
		pricing.serviceFeeBps < 0 ||
		pricing.serviceFeeBps > 10000 ||
		!Number.isSafeInteger(pricing.shippingUsd) ||
		pricing.shippingUsd < 0
	)
		throw new Error("Invalid checkout fees");
	const sourceCurrency = items[0]?.currency;
	if (sourceCurrency !== "GEL" && sourceCurrency !== "USD")
		throw new Error("Unsupported cart currency");
	const lines = items.map((item) => {
		if (
			item.currency !== sourceCurrency ||
			!Number.isSafeInteger(item.price) ||
			item.price <= 0 ||
			!Number.isInteger(item.quantity) ||
			item.quantity < 1 ||
			item.quantity > 10
		)
			throw new Error("Invalid cart item");
		const usdPrice =
			sourceCurrency === "GEL"
				? Math.round(item.price / pricing.gelPerUsd)
				: item.price;
		if (usdPrice < 1) throw new Error("Invalid converted price");
		return { ...item, usdPrice, usdTotal: usdPrice * item.quantity };
	});
	const sourceSubtotal = lines.reduce(
		(sum, line) => sum + line.price * line.quantity,
		0,
	);
	const subtotalUsd = lines.reduce((sum, line) => sum + line.usdTotal, 0);
	const shippingUsd =
		subtotalUsd >= site.delivery.freeFrom ? 0 : pricing.shippingUsd;
	const serviceFeeUsd = Math.round(
		(subtotalUsd * pricing.serviceFeeBps) / 10000,
	);
	const totalUsd = subtotalUsd + shippingUsd + serviceFeeUsd;
	const paymentTotal =
		pricing.paymentCurrency === "USD"
			? totalUsd
			: Math.round(totalUsd * pricing.gelPerUsd);
	if (
		![sourceSubtotal, subtotalUsd, totalUsd, paymentTotal].every(
			(n) => Number.isSafeInteger(n) && n > 0 && n <= 2_000_000_000,
		)
	)
		throw new Error("Order total is too large");
	return {
		lines,
		sourceCurrency,
		sourceSubtotal,
		subtotalUsd,
		shippingUsd,
		serviceFeeUsd,
		totalUsd,
		paymentTotal,
		pricing,
	};
}

export type CheckoutView = {
	id: string;
	quote: CheckoutQuote;
	address: CheckoutAddress;
	expiresAt: string;
	proofUploaded: boolean;
	submittedAt: string | null;
};
