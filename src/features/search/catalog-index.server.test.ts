import { beforeEach, describe, expect, it, vi } from "vitest";

const { ft, findMany, redis } = vi.hoisted(() => ({
	ft: { list: vi.fn(), create: vi.fn(), dropIndex: vi.fn(), search: vi.fn() },
	findMany: vi.fn(),
	redis: { scan: vi.fn() },
}));
vi.mock("#/server/env.server", () => ({
	env: { BETTER_AUTH_SECRET: "test-store-id-secret" },
}));
vi.mock("./redis-ft.server", () => ({ ft }));
vi.mock("#/db", () => ({ db: { query: { product: { findMany } } } }));
vi.mock("#/server/redis.server", () => ({ getRedis: async () => redis }));

beforeEach(() => {
	vi.resetModules();
	vi.resetAllMocks();
	findMany.mockResolvedValue([]);
	redis.scan.mockResolvedValue({ cursor: "0", keys: [] });
});

describe("catalog initialization", () => {
	it("rebuilds derived fields when a new schema indexes existing documents", async () => {
		ft.list.mockResolvedValue([]);
		ft.search.mockResolvedValue({ total: 10 });
		const { ensureCatalogReady } = await import("./catalog-index.server");
		await Promise.all([ensureCatalogReady(), ensureCatalogReady()]);
		expect(ft.create).toHaveBeenCalledOnce();
		expect(findMany).toHaveBeenCalledOnce();
	});

	it.each([0, 10])(
		"only refills an existing index when empty (count %s)",
		async (total) => {
			const { INDEX, ensureCatalogReady } = await import(
				"./catalog-index.server"
			);
			ft.list.mockResolvedValue([INDEX]);
			ft.search.mockResolvedValue({ total });
			await ensureCatalogReady();
			expect(ft.create).not.toHaveBeenCalled();
			expect(findMany).toHaveBeenCalledTimes(total === 0 ? 1 : 0);
		},
	);

	it("retries an interrupted rebuild on the next request", async () => {
		ft.list.mockResolvedValue([]);
		ft.search.mockResolvedValue({ total: 10 });
		findMany.mockRejectedValueOnce(new Error("database unavailable"));
		const { ensureCatalogReady } = await import("./catalog-index.server");
		await expect(ensureCatalogReady()).rejects.toThrow("database unavailable");
		await expect(ensureCatalogReady()).resolves.toBeUndefined();
		expect(findMany).toHaveBeenCalledTimes(2);
	});
});
