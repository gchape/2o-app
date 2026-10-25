import { site } from "#/data/site";
import {
	DEFAULT_LOCALE,
	type Locale,
	languageTags,
	useLocale,
} from "#/i18n/locale";

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, whole: boolean, locale: Locale) {
	const key = `${locale}:${currency}:${whole}`;
	let formatter = formatters.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat(languageTags[locale], {
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
	locale: Locale = DEFAULT_LOCALE,
) {
	return getFormatter(currency, false, locale).format(minorUnits / 100);
}

/** Like `formatPrice`, but whole amounts lose their decimals. */
export function formatPriceCompact(
	minorUnits: number,
	currency: string = site.currency,
	locale: Locale = DEFAULT_LOCALE,
) {
	return getFormatter(currency, minorUnits % 100 === 0, locale).format(
		minorUnits / 100,
	);
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
