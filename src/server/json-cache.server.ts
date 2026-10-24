import { TimeUnit } from "@valkey/valkey-glide";
import type { z } from "zod";
import { getValkey } from "./valkey.server";

type JsonCacheOptions<S extends z.ZodType> = {
	key: string;
	ttlSeconds: number;
	/** Validates cached payloads, so a changed shape reads as a miss. */
	schema: S;
	/** Source of truth, used on a miss or when Valkey is down. */
	compute: () => Promise<z.output<S>>;
};

/**
 * A Valkey-backed JSON cache with a Postgres (or any other) fallback. Reads
 * never throw: an empty, stale-shaped or unreachable cache falls through to
 * `compute`. Returns `get` (cache-aside) and `refresh` (recompute, overwrite).
 */
export function createJsonCache<S extends z.ZodType>({
	key,
	ttlSeconds,
	schema,
	compute,
}: JsonCacheOptions<S>) {
	type Value = z.output<S>;

	async function read(): Promise<Value | null> {
		try {
			const hit = await (await getValkey()).get(key);
			if (!hit) return null;

			const { success, data } = schema.safeParse(JSON.parse(String(hit)));
			return success ? data : null;
		} catch (error) {
			console.warn(`Cache read failed (${key}):`, error);
			return null;
		}
	}

	async function write(value: Value) {
		await (await getValkey()).set(key, JSON.stringify(value), {
			expiry: { type: TimeUnit.Seconds, count: ttlSeconds },
		});
	}

	return {
		async get(): Promise<Value> {
			const cached = await read();
			if (cached) return cached;

			const value = await compute();
			write(value).catch((error) =>
				console.warn(`Cache write failed (${key}):`, error),
			);
			return value;
		},
		async refresh(): Promise<Value> {
			const value = await compute();
			await write(value);
			return value;
		},
	};
}
