import { GlideClient } from "@valkey/valkey-glide";
import { env } from "./env.server";

export const valkey = await GlideClient.createClient({
	addresses: [
		{
			host: env.VALKEY_HOST,
			port: env.VALKEY_PORT,
		},
	],
});
