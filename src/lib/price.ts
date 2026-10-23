import { site } from "#/data/site";

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, whole: boolean) {
	const key = `${currency}:${whole}`;
	let formatter = formatters.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat("en-US", {
			style: "currency",
			currency,
			currencyDisplay: "narrowSymbol",
			...(whole && { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
		});
		formatters.set(key, formatter);
	}
	return formatter;
}

/** Formats an amount in minor units (e.g. tetri) as a localized currency string. */
export function formatPrice(
	minorUnits: number,
	currency: string = site.currency,
) {
	return getFormatter(currency, false).format(minorUnits / 100);
}

/** Like `formatPrice`, but whole amounts lose their decimals: ₾59 and ₾59.90. */
export function formatPriceCompact(
	minorUnits: number,
	currency: string = site.currency,
) {
	return getFormatter(currency, minorUnits % 100 === 0).format(
		minorUnits / 100,
	);
}

export const isOnSale = (
	price: number,
	originalPrice: number | null,
): originalPrice is number => originalPrice !== null && originalPrice > price;
