import Decimal from "decimal.js";
import {
	type CartItem,
	MAX_CART_LINES,
	MAX_QUANTITY,
} from "#/features/cart/cart";
import {
	roundMinorUnits,
	unitPriceUsd,
} from "#/features/shipping/money.server";
import {
	groupShipments,
	shippingCharge,
	validShippingRule,
} from "#/features/shipping/shipping";
import type { CheckoutPricing, CheckoutQuote } from "./checkout";

/**
 * Freeze prices in integer minor units: convert each unit to USD before applying
 * quantities, charge the fee on merchandise, then convert the final total to GEL.
 * Decimal half-up rounding avoids binary floating-point errors at half a cent.
 * Each warehouse qualifies for free shipping using only its own merchandise.
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
		pricing.serviceFeeBps > 10000
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
		const usdPrice = unitPriceUsd(
			item.price,
			sourceCurrency,
			pricing.gelPerUsd,
		);
		if (usdPrice === null || usdPrice < 1)
			throw new Error("Invalid converted price");
		return { ...item, usdPrice, usdTotal: usdPrice * item.quantity };
	});
	const sourceSubtotal = lines.reduce(
		(sum, line) => sum + line.price * line.quantity,
		0,
	);
	const subtotalUsd = lines.reduce((sum, line) => sum + line.usdTotal, 0);
	const shipments = groupShipments(lines).map(
		({ groupId, lines: shipmentLines }) => {
			const rule = shipmentLines[0]?.shipping?.rule;
			if (
				!validShippingRule(rule) ||
				shipmentLines.some(
					(line) =>
						!line.shipping?.groupId ||
						line.shipping.rule?.flatRateUsd !== rule.flatRateUsd ||
						line.shipping.rule?.freeFromUsd !== rule.freeFromUsd,
				)
			)
				throw new Error(
					"Shipping is not available for some items. Please review your cart or contact us.",
				);
			const subtotalUsd = shipmentLines.reduce(
				(sum, line) => sum + line.usdTotal,
				0,
			);
			return {
				groupId,
				itemIds: shipmentLines.map((line) => line.id),
				subtotalUsd,
				shippingUsd: shippingCharge(subtotalUsd, rule),
				rule: { ...rule },
			};
		},
	);
	const shippingUsd = shipments.reduce(
		(sum, shipment) => sum + shipment.shippingUsd,
		0,
	);
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
		shipments,
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
