import { countDistinct, max } from "drizzle-orm";
import { db } from "#/db";
import { onSale } from "#/db/predicates";
import { product, skus } from "#/db/schema";
import { createJsonCache } from "#/server/json-cache.server";
import { type Stats, statsSchema } from "./stats.schema";

async function computeStats(): Promise<Stats> {
	const [[dealRow], [statRow]] = await Promise.all([
		db
			.select({ count: countDistinct(skus.productId) })
			.from(skus)
			.where(onSale),
		db
			.select({
				warehouses: countDistinct(product.warehouse),
				checkedAt: max(product.lastSeenAt),
			})
			.from(product),
	]);

	return {
		deals: dealRow?.count ?? 0,
		warehouses: statRow?.warehouses ?? 0,
		checkedAt: statRow?.checkedAt?.toISOString() ?? null,
	};
}

const statsCache = createJsonCache({
	key: "stats",
	ttlSeconds: 60 * 60 * 24,
	schema: statsSchema,
	compute: computeStats,
});

/** Cached stats, queried from Postgres if Redis is empty or down. */
export const getStats = (): Promise<Stats> => statsCache.get();

/** @public Recomputes and overwrites the cache. For the importer to call after a run. */
export const refreshStats = (): Promise<Stats> => statsCache.refresh();
