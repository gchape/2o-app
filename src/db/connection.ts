import { checkServerIdentity } from "node:tls";
import type { PoolConfig } from "pg";
import { z } from "zod";

/**
 * Database credentials, parsed on their own so tooling that only needs the
 * database (drizzle-kit, the migrate container) doesn't also require every
 * application secret.
 */
const dbEnv = z
	.object({
		DB_HOST: z.string().min(1).default("localhost"),
		DB_PORT: z.coerce.number().int().positive().default(5432),
		DB_USER: z.string().min(1).default("root"),
		DB_PASSWORD: z.string(),
		DB_NAME: z.string().min(1).default("2o"),
		DB_SSL: z.enum(["true", "false"]).default("false"),
		DB_SSL_SERVERNAME: z.string().optional(),
	})
	.parse(process.env);

export const dbConnection = {
	host: dbEnv.DB_HOST,
	port: dbEnv.DB_PORT,
	user: dbEnv.DB_USER,
	password: dbEnv.DB_PASSWORD,
	database: dbEnv.DB_NAME,
	max: 20,
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 5_000,
	maxLifetimeSeconds: 1_800,
	ssl: dbEnv.DB_SSL === "true" && {
		rejectUnauthorized: true,
		checkServerIdentity: (hostname, cert) =>
			checkServerIdentity(dbEnv.DB_SSL_SERVERNAME || hostname, cert),
	},
} satisfies PoolConfig;
