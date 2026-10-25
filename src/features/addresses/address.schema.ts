import { z } from "zod";
import { DEFAULT_LOCALE, type Locale } from "#/i18n/locale";
import { translate } from "#/i18n/translate";

/** Saved addresses one account may hold. */
export const MAX_ADDRESSES = 10;

export function createAddressSchema(locale: Locale = DEFAULT_LOCALE) {
	const t = (source: string, values?: Record<string, string | number>) =>
		translate(source, values, locale);
	const text = (max: number, empty: string) =>
		z
			.string()
			.trim()
			.min(1, empty)
			.max(max, t("Use {{max}} characters or fewer", { max }));

	const optionalText = (max: number) =>
		z.string().trim().max(max, t("Use {{max}} characters or fewer", { max }));

	const PHONE_ERROR = t("Enter a valid phone number");

	/** Shared validation for the address form and server functions. */
	return z.object({
		fullName: text(100, t("Enter the recipient's name")),
		phone: z
			.string()
			.trim()
			.refine(
				(value) =>
					value.length <= 30 &&
					/^\+?[\d\s()-]+$/.test(value) &&
					value.replace(/\D/g, "").length >= 6,
				PHONE_ERROR,
			),
		line1: text(150, t("Enter a street address")),
		line2: optionalText(150),
		city: text(80, t("Enter a city")),
		state: text(80, t("Enter a state")),
		postalCode: text(20, t("Enter a ZIP code")),
		country: text(80, t("Enter a country")),
		/** Ask for this address to become the primary one. Ignored when it already is. */
		isPrimary: z.boolean(),
	});
}
export const addressSchema = createAddressSchema();

export type AddressInput = z.infer<typeof addressSchema>;
