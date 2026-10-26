import { z } from "zod";
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
	rateDate: string;
	serviceFeeBps: number;
	shippingUsd: number;
	iban: string;
};
type CheckoutLine = CartItem & { usdPrice: number; usdTotal: number };
export type CheckoutQuote = {
	lines: CheckoutLine[];
	sourceCurrency: "USD" | "GEL";
	sourceSubtotal: number;
	subtotalUsd: number;
	shippingUsd: number;
	serviceFeeUsd: number;
	totalUsd: number;
	totalGel: number;
	pricing: CheckoutPricing;
};

export type CheckoutView = {
	id: string;
	quote: CheckoutQuote;
	address: CheckoutAddress;
	expiresAt: string;
	proofUploaded: boolean;
	submittedAt: string | null;
};
