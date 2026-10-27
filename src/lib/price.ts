import { site } from "#/data/site";
import { DEFAULT_LOCALE, type Locale, useLocale } from "#/i18n/locale";

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

// Georgian currency placement and separators differ across ICU/CLDR versions.
// Use one numeric format and assemble the locale's layout explicitly for SSR.
function formatAmount(
	minorUnits: number,
	currency: string,
	whole: boolean,
	locale: Locale,
) {
	const parts = getFormatter(currency, whole).formatToParts(minorUnits / 100);
	const symbol =
		parts.find((part) => part.type === "currency")?.value ?? currency;
	const number = parts
		.filter((part) => part.type !== "currency" && part.type !== "literal")
		.map((part) => {
			if (locale === "ka") {
				if (part.type === "group") return "\u00a0";
				if (part.type === "decimal") return ",";
			}
			return part.value;
		})
		.join("");
	if (locale === "ka") return `${number}\u00a0${symbol}`;
	return number.startsWith("-")
		? `-${symbol}${number.slice(1)}`
		: `${symbol}${number}`;
}

/** Formats an amount in minor units (e.g. tetri) as a localized currency string. */
export function formatPrice(
	minorUnits: number,
	currency: string = site.currency,
	locale: Locale = DEFAULT_LOCALE,
) {
	return formatAmount(minorUnits, currency, false, locale);
}

/** Like `formatPrice`, but whole amounts lose their decimals. */
export function formatPriceCompact(
	minorUnits: number,
	currency: string = site.currency,
	locale: Locale = DEFAULT_LOCALE,
) {
	return formatAmount(minorUnits, currency, minorUnits % 100 === 0, locale);
}

export const isOnSale = (
	price: number,
	originalPrice: number | null,
): originalPrice is number => originalPrice !== null && originalPrice > price;

export function usePriceFormatter() {
	const locale = useLocale();
	return {
		formatPrice: (amount: number, currency?: string) =>
			formatPrice(amount, currency, locale),
		formatPriceCompact: (amount: number, currency?: string) =>
			formatPriceCompact(amount, currency, locale),
	};
}
