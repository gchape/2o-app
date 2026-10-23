import { TimeUnit } from "@valkey/valkey-glide";
import { countDistinct, max } from "drizzle-orm";
import { db } from "#/db";
import { product, skus } from "#/db/schema";
import { onSale } from "#/features/catalog/product.server";
import { getValkey } from "#/server/valkey.server";
import { type Stats, statsSchema } from "./stats.schema";

const KEY = "stats";
const TTL_SECONDS = 60 * 60 * 24;

/** The cached stats, or `null` if the cache is empty, stale-shaped or down. */
async function readCache(): Promise<Stats | null> {
	try {
		const hit = await (await getValkey()).get(KEY);
		if (!hit) return null;

		const parsed = statsSchema.safeParse(JSON.parse(String(hit)));
		return parsed.success ? parsed.data : null;
	} catch (error) {
		console.warn("Stats cache read failed:", error);
		return null;
	}
}

async function writeCache(stats: Stats) {
	await (await getValkey()).set(KEY, JSON.stringify(stats), {
		expiry: { type: TimeUnit.Seconds, count: TTL_SECONDS },
	});
}

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

/** Cached stats, queried from Postgres if Valkey is empty or down. */
export async function getStats(): Promise<Stats> {
	const cached = await readCache();
	if (cached) return cached;

	const stats = await computeStats();
	writeCache(stats).catch((error) =>
		console.warn("Stats cache write failed:", error),
	);
	return stats;
}

/** @public Recomputes and overwrites the cache. For the importer to call after a run. */
export async function refreshStats(): Promise<Stats> {
	const stats = await computeStats();
	await writeCache(stats);
	return stats;
}
