import { createClient } from "redis";
import { env } from "./env.server";

const createRedisClient = () =>
	createClient({
		RESP: 2,
		name: "2o",
		socket: {
			host: env.REDIS_HOST,
			port: env.REDIS_PORT,
			connectTimeout: 1_000,
			// Detect silent sockets, including commands already written to them.
			socketTimeout: 10_000,
			reconnectStrategy: (retries) =>
				retries >= 5
					? false
					: Math.min(100 * 2 ** retries, 2_000) +
						Math.floor(Math.random() * 200),
		},
		// Heartbeats keep healthy idle sockets below socketTimeout.
		pingInterval: 5_000,
		// This deadline applies only while a command is waiting to be sent.
		commandOptions: { timeout: 1_000 },
		disableOfflineQueue: true,
		commandsQueueMaxLength: 1_000,
	});

let client: Promise<ReturnType<typeof createRedisClient>> | undefined;

/** Shared lazy Redis connection; failed initialization is retried on the next call. */
export const getRedis = () => {
	if (client) return client;

	const pending: Promise<ReturnType<typeof createRedisClient>> = (async () => {
		const connection = createRedisClient();
		connection.on("error", (error) =>
			console.warn("Redis client error:", error),
		);
		// A terminal disconnect must not leave a closed client cached forever.
		const reset = () => {
			if (client === pending) client = undefined;
		};
		connection.on("end", reset);
		connection.on("terminated", reset);
		try {
			await connection.connect();
			return connection;
		} catch (error) {
			if (connection.isOpen) connection.destroy();
			throw error;
		}
	})().catch((error: unknown) => {
		if (client === pending) client = undefined;
		throw error;
	});
	client = pending;
	return pending;
};
