import { z } from "zod";

/** Saved addresses one account may hold. */
export const MAX_ADDRESSES = 10;

const text = (max: number, empty: string) =>
	z.string().trim().min(1, empty).max(max, `Use ${max} characters or fewer`);

const optionalText = (max: number) =>
	z.string().trim().max(max, `Use ${max} characters or fewer`);

const PHONE_ERROR = "Enter a valid phone number";

/**
 * One address as the form submits it and the server function accepts it, so
 * both sides run the same rules. The country is not asked for: the store
 * delivers in one region (`site.delivery.region`), which the table defaults to.
 */
export const addressSchema = z.object({
	fullName: text(100, "Enter the recipient's name"),
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
	line1: text(150, "Enter a street address"),
	line2: optionalText(150),
	city: text(80, "Enter a city"),
	postalCode: optionalText(20),
	/** Ask for this address to become the primary one. Ignored when it already is. */
	isPrimary: z.boolean(),
});

export type AddressInput = z.infer<typeof addressSchema>;
