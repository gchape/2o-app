import { z } from "zod";

/** Blank values in `.env` (`KEY=`) count as unset. */
const optionalString = z
	.string()
	.optional()
	.transform((value) => value?.trim() || undefined);

const optionalUrl = optionalString.pipe(z.url().optional());

const envSchema = z
	.object({
		NODE_ENV: z.string().optional(),

		REDIS_HOST: z.string().min(1).default("localhost"),
		REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

		BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
		BETTER_AUTH_SECRET: z.string().min(32),

		// Social sign-in is optional: a provider is enabled when both values are set.
		GOOGLE_CLIENT_ID: optionalString,
		GOOGLE_CLIENT_SECRET: optionalString,
		FACEBOOK_CLIENT_ID: optionalString,
		FACEBOOK_CLIENT_SECRET: optionalString,

		// Without a key, emails are logged instead of sent (required in production).
		RESEND_API_KEY: optionalString,
		EMAIL_FROM: z.string().min(1).default("2o <onboarding@resend.dev>"),

		/** Public origin used in the sitemap. Falls back to `BETTER_AUTH_URL`. */
		SITE_URL: optionalUrl,

		/** Tawk.to embed URL; the chat widget is hidden when unset. */
		CHAT_EMBED_URL: optionalUrl,

		// Checkout stays unavailable until these are valid and NBG's exchange rate can be fetched.
		CHECKOUT_IBAN: optionalString,
		CHECKOUT_SERVICE_FEE_BPS: optionalString,
		CHECKOUT_SHIPPING_USD_CENTS: optionalString,
		TELEGRAM_BOT_TOKEN: optionalString,
		TELEGRAM_CHAT_ID: optionalString,
	})
	.refine(
		(e) => Boolean(e.GOOGLE_CLIENT_ID) === Boolean(e.GOOGLE_CLIENT_SECRET),
		{
			message: "Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither",
			path: ["GOOGLE_CLIENT_ID"],
		},
	)
	.refine(
		(e) => Boolean(e.FACEBOOK_CLIENT_ID) === Boolean(e.FACEBOOK_CLIENT_SECRET),
		{
			message:
				"Set both FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET, or neither",
			path: ["FACEBOOK_CLIENT_ID"],
		},
	)
	.refine((e) => e.NODE_ENV !== "production" || e.RESEND_API_KEY, {
		message: "RESEND_API_KEY is required in production",
		path: ["RESEND_API_KEY"],
	})
	.transform((e) => ({ ...e, SITE_URL: e.SITE_URL ?? e.BETTER_AUTH_URL }));

/** Parses and validates an environment; exported so the rules can be tested. */
export const parseEnv = (source: Record<string, string | undefined>) =>
	envSchema.parse(source);

/** Validated server environment. Database settings live in `#/db/connection`. */
export const env = parseEnv(process.env);
