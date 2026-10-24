import type { z } from "zod";
import { getRedis } from "./redis.server";

type JsonCacheOptions<S extends z.ZodType> = {
	key: string;
	ttlSeconds: number;
	/** Validates cached payloads, so a changed shape reads as a miss. */
	schema: S;
	/** Source of truth, used on a miss or when Redis is down. */
	compute: () => Promise<z.output<S>>;
};

/**
 * A Redis-backed JSON cache with a Postgres (or any other) fallback. Reads
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
			const hit = await (await getRedis()).get(key);
			if (!hit) return null;

			const { success, data } = schema.safeParse(JSON.parse(String(hit)));
			return success ? data : null;
		} catch (error) {
			console.warn(`Cache read failed (${key}):`, error);
			return null;
		}
	}

	async function write(value: Value) {
		await (await getRedis()).set(key, JSON.stringify(value), {
			EX: ttlSeconds,
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
