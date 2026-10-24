import { GlideClient } from "@valkey/valkey-glide";
import { env } from "./env.server";

let client: Promise<GlideClient> | undefined;

/**
 * Shared Valkey client for 2o.
 * Connects lazily and retries initialization on the next call
 * if the initial connection attempt fails.
 */
export const getValkey = (): Promise<GlideClient> => {
	client ??= Promise.try(() =>
		GlideClient.createClient({
			addresses: [{ host: env.VALKEY_HOST, port: env.VALKEY_PORT }],
			clientName: "2o",
			requestTimeout: 1_000,
			inflightRequestsLimit: 1_000,
			connectionBackoff: {
				numberOfRetries: 5,
				factor: 100,
				exponentBase: 2,
				jitterPercent: 20,
			},
		}),
	).catch((error: unknown) => {
		client = undefined;
		throw error;
	});

	return client;
};
