import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

afterEach(() => vi.restoreAllMocks());

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

	it("does not let a late event from an old client discard its replacement", async () => {
		const closed = connection();
		const recovered = connection();
		createClient.mockReturnValueOnce(closed).mockReturnValueOnce(recovered);
		const { getRedis } = await import("./redis.server");
		await getRedis();
		closed.emit("terminated");
		await expect(getRedis()).resolves.toBe(recovered);
		closed.emit("end");
		await expect(getRedis()).resolves.toBe(recovered);
		expect(createClient).toHaveBeenCalledTimes(2);
	});

	it("keeps a replacement when an older initialization subsequently rejects", async () => {
		const failed = connection();
		const connecting = Promise.withResolvers<void>();
		failed.connect.mockReturnValue(connecting.promise);
		const recovered = connection();
		createClient.mockReturnValueOnce(failed).mockReturnValueOnce(recovered);
		const { getRedis } = await import("./redis.server");
		const pending = getRedis();
		failed.emit("terminated");
		await expect(getRedis()).resolves.toBe(recovered);
		connecting.reject(new Error("unavailable"));
		await expect(pending).rejects.toThrow("unavailable");
		await expect(getRedis()).resolves.toBe(recovered);
		expect(createClient).toHaveBeenCalledTimes(2);
	});

	it("destroys a partially open connection when initialization fails", async () => {
		const failed = connection();
		failed.isOpen = true;
		failed.connect.mockRejectedValue(new Error("handshake failed"));
		createClient.mockReturnValue(failed);
		const { getRedis } = await import("./redis.server");
		await expect(getRedis()).rejects.toThrow("handshake failed");
		expect(failed.destroy).toHaveBeenCalledTimes(1);
	});

	it("uses bounded jittered retries and heartbeats below the socket idle timeout", async () => {
		vi.spyOn(Math, "random").mockReturnValue(0.5);
		createClient.mockReturnValue(connection());
		const { getRedis } = await import("./redis.server");
		await getRedis();
		const options = createClient.mock.calls[0]?.[0];
		expect(options.socket.reconnectStrategy(0)).toBe(200);
		expect(options.socket.reconnectStrategy(4)).toBe(1700);
		expect(options.socket.reconnectStrategy(5)).toBe(false);
		expect(options.pingInterval).toBeLessThan(options.socket.socketTimeout);
		expect(options.disableOfflineQueue).toBe(true);
	});
});
