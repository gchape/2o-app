import { createHmac } from "node:crypto";
import { z } from "zod";
import { env } from "#/server/env.server";

const ruleSchema = z
	.object({
		flatRateUsd: z.number().int().min(0).max(100_000),
		freeFromUsd: z.number().int().min(0).max(2_000_000_000).nullable(),
	})
	.strict();
const rulesSchema = z.record(
	z.string().regex(/^(?!www\.)[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,}$/),
	ruleSchema,
);

/** No fallback rate: an absent or malformed configuration cannot price shipping. */
export function parseShippingRules(value: unknown) {
	if (typeof value !== "string") return null;
	try {
		const parsed = rulesSchema.safeParse(JSON.parse(value));
		return parsed.success && Object.keys(parsed.data).length
			? parsed.data
			: null;
	} catch {
		return null;
	}
}

export function warehouseShipping(warehouse: string) {
	const rules = parseShippingRules(env.WAREHOUSE_SHIPPING_RULES);
	return {
		groupId: createHmac("sha256", env.BETTER_AUTH_SECRET)
			.update(warehouse)
			.digest("hex"),
		rule:
			rules && Object.hasOwn(rules, warehouse)
				? (rules[warehouse] ?? null)
				: null,
	};
}
