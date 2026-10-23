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
	})
	.parse(process.env);

export const dbConnection = {
	host: dbEnv.DB_HOST,
	port: dbEnv.DB_PORT,
	user: dbEnv.DB_USER,
	password: dbEnv.DB_PASSWORD,
	database: dbEnv.DB_NAME,
};
