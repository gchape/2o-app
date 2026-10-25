import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createJsonCache } from "./json-cache.server";

const redis = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("./redis.server", () => ({ getRedis: async () => redis }));

beforeEach(() => vi.resetAllMocks());

describe("JSON cache", () => {
	it.each([0, false, ""])(
		"serves the cached value %j without recomputing",
		async (value) => {
			redis.get.mockResolvedValue(JSON.stringify(value));
			const compute = vi.fn();
			const cache = createJsonCache({
				key: "test",
				ttlSeconds: 60,
				schema: z.union([z.number(), z.boolean(), z.string()]),
				compute,
			});

			await expect(cache.get()).resolves.toBe(value);
			expect(compute).not.toHaveBeenCalled();
			expect(redis.set).not.toHaveBeenCalled();
		},
	);

	it.each([null, '"old shape"'])(
		"recomputes missing or incompatible cached data (%s)",
		async (value) => {
			redis.get.mockResolvedValue(value);
			const compute = vi.fn().mockResolvedValue(42);
			const cache = createJsonCache({
				key: "test",
				ttlSeconds: 60,
				schema: z.number(),
				compute,
			});

			await expect(cache.get()).resolves.toBe(42);
			expect(compute).toHaveBeenCalledOnce();
			expect(redis.set).toHaveBeenCalledWith("test", "42", { EX: 60 });
		},
	);
});
