import type { z } from "zod";
import { getRedis } from "./redis.server";

type JsonCacheOptions<S extends z.ZodType> = {
	key: string;
	ttlSeconds: number;
	schema: S;
	compute: () => Promise<z.output<S>>;
};

/**
 * Invalid or unavailable cache entries fall through to `compute`; source errors
 * still propagate. `get` writes opportunistically, while `refresh` awaits storage.
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
			if (cached !== null) return cached;

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
