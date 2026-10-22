import { z } from "zod";

const envSchema = z.object({
	DB_HOST: z.string().min(1).default("localhost"),
	DB_PORT: z.coerce.number().int().positive().default(5432),
	DB_USER: z.string().min(1).default("root"),
	DB_PASSWORD: z.string(),
	DB_NAME: z.string().min(1).default("2o"),

	VALKEY_HOST: z.string().min(1).default("localhost"),
	VALKEY_PORT: z.coerce.number().int().positive().default(6379),

	BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
	BETTER_AUTH_SECRET: z.string().min(32),

	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),

	FACEBOOK_CLIENT_ID: z.string().min(1),
	FACEBOOK_CLIENT_SECRET: z.string().min(1),

	RESEND_API_KEY: z.string().min(1),
	EMAIL_FROM: z.string().min(1).default("2o <onboarding@resend.dev>"),

	SITE_URL: z.url().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
