import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { emails, send } = vi.hoisted(() => {
	const emails: { to: string; subject: string; html: string }[] = [];
	return {
		emails,
		send: vi.fn(async (email: (typeof emails)[number]) => {
			emails.push(email);
			return { error: null };
		}),
	};
});

vi.mock("resend", () => ({
	Resend: class {
		emails = { send };
	},
}));
vi.mock("#/db", () => ({ db: {} }));
vi.mock("@better-auth/drizzle-adapter/relations-v2", () => ({
	drizzleAdapter: () => undefined,
}));
vi.mock("#/server/redis.server", () => ({ getRedis: vi.fn() }));
vi.mock("#/server/env.server", () => ({
	env: {
		BETTER_AUTH_URL: "http://localhost:3000",
		BETTER_AUTH_SECRET: "test-secret-that-is-long-enough-for-auth",
		RESEND_API_KEY: "test-key",
		EMAIL_FROM: "2o <test@example.com>",
	},
}));

const { auth: appAuth } = await import("./auth.server");

function createTestAuth() {
	return betterAuth({
		...appAuth.options,
		database: memoryAdapter({
			user: [],
			session: [],
			account: [],
			verification: [],
		}),
		secondaryStorage: undefined,
		rateLimit: { enabled: false },
		plugins: appAuth.options.plugins.filter(
			(plugin) => plugin.id === "email-otp",
		),
	});
}

let auth = createTestAuth();
const email = "shopper@example.com";
const password = "original-password-123";
const newPassword = "replacement-password-456";

async function post(path: string, body: object) {
	return auth.handler(
		new Request(`http://localhost:3000/api/auth${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: "http://localhost:3000",
			},
			body: JSON.stringify(body),
		}),
	);
}

function lastCode() {
	const message = emails.at(-1);
	expect(message?.to).toBe(email);
	const code = message?.html.match(/<strong>(\d{6})<\/strong>/)?.[1];
	expect(code).toBeDefined();
	return code;
}

beforeEach(() => {
	auth = createTestAuth();
	emails.length = 0;
});

describe("email codes through Resend", () => {
	it("requires email verification and rejects incorrect or reused codes", async () => {
		const signup = await post("/sign-up/email", {
			name: "Shopper",
			email,
			password,
		});
		expect(signup.status).toBe(200);
		expect((await signup.json()).token).toBeNull();
		expect(lastCode()).toMatch(/^\d{6}$/);

		expect((await post("/sign-in/email", { email, password })).status).toBe(
			403,
		);
		const otp = lastCode();
		const incorrect = otp === "000000" ? "111111" : "000000";
		expect(
			(await post("/email-otp/verify-email", { email, otp: incorrect })).ok,
		).toBe(false);
		expect((await post("/email-otp/verify-email", { email, otp })).ok).toBe(
			true,
		);
		expect((await post("/email-otp/verify-email", { email, otp })).ok).toBe(
			false,
		);
		expect((await post("/sign-in/email", { email, password })).ok).toBe(true);
	});

	it("resets passwords only with a valid code and revokes existing sessions", async () => {
		await post("/sign-up/email", { name: "Shopper", email, password });
		await post("/email-otp/verify-email", { email, otp: lastCode() });
		const signedIn = await post("/sign-in/email", { email, password });
		const cookie = signedIn.headers
			.getSetCookie()
			.map((value) => value.split(";")[0])
			.join("; ");
		expect(cookie).not.toBe("");
		expect(
			(await post("/email-otp/request-password-reset", { email })).ok,
		).toBe(true);
		const otp = lastCode();
		expect(emails.at(-1)?.subject).toBe("Your password reset code");
		const incorrect = otp === "000000" ? "111111" : "000000";
		expect(
			(
				await post("/email-otp/reset-password", {
					email,
					otp: incorrect,
					password: newPassword,
				})
			).ok,
		).toBe(false);
		expect(
			(
				await post("/email-otp/reset-password", {
					email,
					otp,
					password: newPassword,
				})
			).ok,
		).toBe(true);
		expect(
			(await post("/email-otp/reset-password", { email, otp, password })).ok,
		).toBe(false);
		expect((await post("/sign-in/email", { email, password })).ok).toBe(false);
		expect(
			(await post("/sign-in/email", { email, password: newPassword })).ok,
		).toBe(true);
		const session = await auth.handler(
			new Request("http://localhost:3000/api/auth/get-session", {
				headers: { cookie },
			}),
		);
		expect(await session.json()).toBeNull();
	});

	it("does not send a recovery email for an unknown account", async () => {
		expect(
			(await post("/email-otp/request-password-reset", { email })).ok,
		).toBe(true);
		expect(emails).toHaveLength(0);
	});
});
