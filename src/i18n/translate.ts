import { useCallback } from "react";
import { DEFAULT_LOCALE, type Locale, useLocale } from "./locale";
import { fill } from "./messages";
import { storefrontKa } from "./storefront-ka";

/** Source text doubles as the English catalog; unknown product data stays intact. */
export function translate(
	source: string,
	values: Record<string, string | number> = {},
	locale: Locale = DEFAULT_LOCALE,
) {
	const message =
		locale === "ka" && Object.hasOwn(storefrontKa, source)
			? storefrontKa[source as keyof typeof storefrontKa]
			: source;
	return fill(message, values);
}

export function useTranslation() {
	const locale = useLocale();
	return useCallback(
		(source: string, values?: Record<string, string | number>) =>
			translate(source, values, locale),
		[locale],
	);
}
