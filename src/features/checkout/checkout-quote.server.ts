import Decimal from "decimal.js";
import { site } from "#/data/site";
import {
	type CartItem,
	MAX_CART_LINES,
	MAX_QUANTITY,
} from "#/features/cart/cart";
import type { CheckoutPricing, CheckoutQuote } from "./checkout";

const roundMinorUnits = (amount: Decimal) =>
	amount.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();

/**
 * Freeze prices in integer minor units: convert each unit to USD before applying
 * quantities, charge the fee on merchandise, then convert the final total to GEL.
 * Decimal half-up rounding avoids binary floating-point errors at half a cent.
 * Free shipping is based on merchandise alone, before fees.
 */
export function calculateQuote(
	items: CartItem[],
	pricing: CheckoutPricing,
): CheckoutQuote {
	if (!items.length || items.length > MAX_CART_LINES)
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
			item.quantity > MAX_QUANTITY
		)
			throw new Error("Invalid cart item");
		const usdPrice =
			sourceCurrency === "GEL"
				? roundMinorUnits(new Decimal(item.price).div(pricing.gelPerUsd))
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
	const totalGel = roundMinorUnits(
		new Decimal(totalUsd).mul(pricing.gelPerUsd),
	);
	if (
		![sourceSubtotal, subtotalUsd, totalUsd, totalGel].every(
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
		totalGel,
		pricing,
	};
}

export type StoredCheckoutQuote = Omit<
	CheckoutQuote,
	"totalGel" | "pricing"
> & {
	totalGel?: number;
	paymentTotal?: number;
	pricing: Omit<CheckoutPricing, "rateDate"> & {
		rateDate?: string;
		rateUpdatedAt?: string;
		paymentCurrency?: "USD" | "GEL";
	};
};

/**
 * Read snapshots created before automatic rates without repricing an order.
 * Preserve an already quoted GEL payment amount and the original rate date.
 */
export function restoreCheckoutQuote(
	quote: StoredCheckoutQuote,
): CheckoutQuote {
	const totalGel =
		quote.totalGel ??
		(quote.pricing.paymentCurrency === "GEL"
			? quote.paymentTotal
			: roundMinorUnits(
					new Decimal(quote.totalUsd).mul(quote.pricing.gelPerUsd),
				));
	const rateDate = quote.pricing.rateDate ?? quote.pricing.rateUpdatedAt;
	if (
		!totalGel ||
		totalGel < 0 ||
		!Number.isSafeInteger(totalGel) ||
		!rateDate ||
		!Number.isFinite(Date.parse(rateDate))
	)
		throw new Error("Invalid checkout snapshot");
	return { ...quote, totalGel, pricing: { ...quote.pricing, rateDate } };
}
