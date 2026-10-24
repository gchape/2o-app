import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("redis", () => ({ createClient }));
vi.mock("./env.server", () => ({
	env: { REDIS_HOST: "localhost", REDIS_PORT: 6379 },
}));

function connection() {
	return Object.assign(new EventEmitter(), {
		connect: vi.fn().mockResolvedValue(undefined),
		isOpen: false,
		destroy: vi.fn(),
	});
}

beforeEach(() => {
	vi.resetModules();
	createClient.mockReset();
});

describe("getRedis", () => {
	it("shares a single connection between concurrent callers", async () => {
		const redis = connection();
		createClient.mockReturnValue(redis);
		const { getRedis } = await import("./redis.server");
		expect(createClient).not.toHaveBeenCalled();
		const clients = await Promise.all([getRedis(), getRedis()]);
		expect(clients).toEqual([redis, redis]);
		expect(redis.connect).toHaveBeenCalledTimes(1);
	});

	it("allows another attempt after initialization fails", async () => {
		const failed = connection();
		failed.connect.mockRejectedValue(new Error("unavailable"));
		const recovered = connection();
		createClient.mockReturnValueOnce(failed).mockReturnValueOnce(recovered);
		const { getRedis } = await import("./redis.server");
		await expect(getRedis()).rejects.toThrow("unavailable");
		await expect(getRedis()).resolves.toBe(recovered);
	});

	it.each(["end", "terminated"])(
		"replaces a connection after %s",
		async (event) => {
			const closed = connection();
			const recovered = connection();
			createClient.mockReturnValueOnce(closed).mockReturnValueOnce(recovered);
			const { getRedis } = await import("./redis.server");
			await getRedis();
			closed.emit(event);
			await expect(getRedis()).resolves.toBe(recovered);
		},
	);
});
