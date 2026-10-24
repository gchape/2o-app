import { describe, expect, it, vi } from "vitest";

// env.server.ts validates process.env when imported, so give it a valid one.
vi.stubEnv("BETTER_AUTH_SECRET", "x".repeat(32));

const { parseEnv } = await import("./env.server");

const base = { BETTER_AUTH_SECRET: "x".repeat(32) };

describe("parseEnv", () => {
	it("defaults Redis locally and accepts an explicit host and port", () => {
		expect(parseEnv(base)).toMatchObject({
			REDIS_HOST: "localhost",
			REDIS_PORT: 6379,
		});
		expect(
			parseEnv({ ...base, REDIS_HOST: "redis", REDIS_PORT: "6380" }),
		).toMatchObject({ REDIS_HOST: "redis", REDIS_PORT: 6380 });
		expect(() => parseEnv({ ...base, REDIS_PORT: "invalid" })).toThrow();
		for (const port of ["0", "-1", "65536", "6379.5"]) {
			expect(() => parseEnv({ ...base, REDIS_PORT: port })).toThrow();
		}
	});

	it("needs only the auth secret in development", () => {
		const env = parseEnv(base);
		expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
		expect(env.RESEND_API_KEY).toBeUndefined();
	});

	it("treats blank values as unset", () => {
		const env = parseEnv({
			...base,
			GOOGLE_CLIENT_ID: "  ",
			CHAT_EMBED_URL: "",
		});
		expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
		expect(env.CHAT_EMBED_URL).toBeUndefined();
	});

	it("falls back to BETTER_AUTH_URL for SITE_URL", () => {
		const env = parseEnv({ ...base, BETTER_AUTH_URL: "https://2o.ge" });
		expect(env.SITE_URL).toBe("https://2o.ge");
		expect(
			parseEnv({
				...base,
				BETTER_AUTH_URL: "https://2o.ge",
				SITE_URL: "https://www.2o.ge",
			}).SITE_URL,
		).toBe("https://www.2o.ge");
	});

	it("rejects half-configured social providers", () => {
		expect(() => parseEnv({ ...base, GOOGLE_CLIENT_ID: "id" })).toThrow(
			/GOOGLE/,
		);
		expect(() => parseEnv({ ...base, FACEBOOK_CLIENT_SECRET: "s" })).toThrow(
			/FACEBOOK/,
		);
		expect(() =>
			parseEnv({ ...base, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "s" }),
		).not.toThrow();
	});

	it("requires an email key in production only", () => {
		expect(() => parseEnv({ ...base, NODE_ENV: "production" })).toThrow(
			/RESEND_API_KEY/,
		);
		expect(() =>
			parseEnv({ ...base, NODE_ENV: "production", RESEND_API_KEY: "re_1" }),
		).not.toThrow();
	});

	it("rejects a short auth secret and a malformed URL", () => {
		expect(() => parseEnv({ BETTER_AUTH_SECRET: "short" })).toThrow();
		expect(() => parseEnv({ ...base, CHAT_EMBED_URL: "not a url" })).toThrow();
	});
});
