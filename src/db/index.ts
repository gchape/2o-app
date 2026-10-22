import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "#/lib/env.server";
import { relations } from "./schema";

export const db = drizzle({
	connection: {
		host: env.DB_HOST,
		port: env.DB_PORT,
		user: env.DB_USER,
		password: env.DB_PASSWORD,
		database: env.DB_NAME,
	},
	relations,
});
