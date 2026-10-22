import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { TimeUnit } from "@valkey/valkey-glide";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db";
import * as schema from "#/db/auth-schema";
import { env } from "#/lib/env.server";
import { valkey } from "#/lib/valkey.server";
import { sendEmail } from "./email.server";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),

	appName: "2o",
	basePath: "/api/auth",
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: ["https://2o.com.ge", "http://localhost:3000"],

	secondaryStorage: {
		get: async (key) => {
			const value = await valkey.get(key);
			return value === null ? null : value.toString();
		},
		set: async (key, value, ttl) => {
			await valkey.set(
				key,
				value,
				ttl ? { expiry: { type: TimeUnit.Seconds, count: ttl } } : undefined,
			);
		},
		delete: async (key) => {
			await valkey.del([key]);
		},
		getAndDelete: async (key) => {
			const value = await valkey.getdel(key);
			return value === null ? null : value.toString();
		},
		increment: async (key, ttl) => {
			const count = await valkey.incr(key);
			if (count === 1) await valkey.expire(key, ttl);
			return count;
		},
	},

	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			void sendEmail({
				to: user.email,
				subject: "Reset your password",
				html: `<p>Click <a href="${url}">here</a> to reset your password. If you didn't request this, ignore this email.</p>`,
			});
		},
	},

	user: {
		changeEmail: {
			enabled: true,
			sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
				void sendEmail({
					to: user.email,
					subject: "Approve your email change",
					html: `<p>You asked to change your email to ${newEmail}. <a href="${url}">Approve the change</a>. If this wasn't you, ignore this email.</p>`,
				});
			},
		},
	},

	advanced: {
		ipAddress: {
			ipAddressHeaders: ["x-forwarded-for"],
		},
	},

	rateLimit: {
		enabled: true,
		storage: "secondary-storage",
		window: 60,
		max: 100,
		customRules: {
			"/sign-in/email": { window: 60, max: 5 },
			"/sign-up/email": { window: 3600, max: 5 },
			"/request-password-reset": { window: 3600, max: 3 },
			"/forget-password": { window: 3600, max: 3 },
			"/change-email": { window: 3600, max: 3 },
		},
	},

	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
		facebook: {
			clientId: env.FACEBOOK_CLIENT_ID,
			clientSecret: env.FACEBOOK_CLIENT_SECRET,
		},
	},

	plugins: [tanstackStartCookies()],
});
