import { GlideClient } from "@valkey/valkey-glide";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle({
	connection: {
		host: process.env.DB_HOST ?? "localhost",
		port: Number(process.env.DB_PORT ?? 5432),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	},
});

export const valkey = await GlideClient.createClient({
	addresses: [
		{
			host: process.env.VALKEY_HOST ?? "localhost",
			port: Number(process.env.VALKEY_PORT ?? 6379),
		},
	],
});
