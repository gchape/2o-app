import type { PeerCertificate } from "node:tls";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
	vi.unstubAllEnvs();
	vi.resetModules();
});

async function connection(ssl: string, servername = "") {
	vi.stubEnv("DB_PASSWORD", "test");
	vi.stubEnv("DB_SSL", ssl);
	vi.stubEnv("DB_SSL_SERVERNAME", servername);
	return (await import("./connection")).dbConnection;
}

describe("database TLS", () => {
	it("respects an explicit opt-out in production", async () => {
		vi.stubEnv("NODE_ENV", "production");
		expect((await connection("false")).ssl).toBe(false);
	});

	it("verifies the configured certificate name when connecting through Docker", async () => {
		vi.stubEnv("NODE_ENV", "development");
		const { ssl } = await connection("true", "db.example.com");
		expect(ssl).toMatchObject({ rejectUnauthorized: true });
		if (!ssl) throw new Error("TLS should be enabled");
		const certificate = {
			subjectaltname: "DNS:db.example.com",
		} as PeerCertificate;
		expect(ssl.checkServerIdentity("db", certificate)).toBeUndefined();
		expect(
			ssl.checkServerIdentity("db", {
				subjectaltname: "DNS:other.example.com",
			} as PeerCertificate),
		).toBeInstanceOf(Error);
	});

	it("verifies the connection hostname when no override is configured", async () => {
		const { ssl } = await connection("true");
		if (!ssl) throw new Error("TLS should be enabled");
		const certificate = { subjectaltname: "DNS:db" } as PeerCertificate;
		expect(ssl.checkServerIdentity("db", certificate)).toBeUndefined();
		expect(ssl.checkServerIdentity("other", certificate)).toBeInstanceOf(Error);
	});
});
