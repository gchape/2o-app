import { GlideClient } from "@valkey/valkey-glide";
import { env } from "./env.server";

let client: Promise<GlideClient> | undefined;

/**
 * Shared Valkey client, connected on first use. Nothing connects at import
 * time, so a Valkey outage can't stop modules from loading, and a failed
 * connect is retried on the next call.
 */
export const getValkey = () => {
	client ??= GlideClient.createClient({
		addresses: [{ host: env.VALKEY_HOST, port: env.VALKEY_PORT }],
		requestTimeout: 1_000,
	}).catch((error) => {
		client = undefined;
		throw error;
	});

	return client;
};
