import { z } from "zod";
import { createJsonCache } from "#/server/json-cache.server";

const NBG_USD_URL =
	"https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?currencies=USD";
const CACHE_SECONDS = 15 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function isCurrentRate(date: string, now: number) {
	const age = now - Date.parse(date);
	return age >= -DAY_MS && age <= 7 * DAY_MS;
}

const rateSchema = z.object({
	gelPerUsd: z.number().positive().max(100),
	date: z.iso.datetime({ offset: true }),
});

const nbgResponseSchema = z
	.array(
		z.object({
			date: z.string(),
			currencies: z.array(
				z.object({
					code: z.string(),
					quantity: z.number().int().positive(),
					rate: z.number().positive(),
					validFromDate: z.string().optional(),
				}),
			),
		}),
	)
	.min(1);

/**
 * Normalize NBG's quoted quantity to GEL per USD. Accept tomorrow's published
 * rate and up to seven days of holiday carryover; reject other dated responses.
 */
export function parseNbgRate(body: unknown, now = Date.now()) {
	const parsed = nbgResponseSchema.safeParse(body);
	const entry = parsed.success ? parsed.data[0] : undefined;
	const usd = entry?.currencies.find((currency) => currency.code === "USD");
	if (!entry || !usd) return null;

	const date = usd.validFromDate ?? entry.date;
	if (!isCurrentRate(date, now)) return null;

	const checked = rateSchema.safeParse({
		gelPerUsd: usd.rate / usd.quantity,
		date,
	});
	return checked.success ? checked.data : null;
}

async function fetchRate() {
	const response = await fetch(NBG_USD_URL, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(5_000),
	});
	if (!response.ok) throw new Error("NBG rate request failed");
	const rate = parseNbgRate(await response.json());
	if (!rate) throw new Error("NBG returned an unusable rate");
	return rate;
}

const rateCache = createJsonCache({
	key: "checkout:gel-per-usd",
	ttlSeconds: CACHE_SECONDS,
	schema: rateSchema.refine((rate) => isCurrentRate(rate.date, Date.now())),
	compute: fetchRate,
});

/**
 * Validate cached rates as well as fresh responses. Failure disables new
 * quotes; existing checkout snapshots never depend on this service.
 */
export async function getGelPerUsd() {
	try {
		return await rateCache.get();
	} catch {
		console.error("NBG exchange rate unavailable");
		return null;
	}
}
