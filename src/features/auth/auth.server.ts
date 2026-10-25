import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { site } from "#/data/site";
import { db } from "#/db";
import * as schema from "#/db/auth-schema";
import { emailTemplates, sendEmail } from "#/features/auth/email.server";
import { socialProviders } from "#/features/auth/social-providers.server";
import { env } from "#/server/env.server";
import { getRedis } from "#/server/redis.server";

const secondaryStorage: NonNullable<BetterAuthOptions["secondaryStorage"]> = {
	get: async (key) => (await getRedis()).get(key),
	getAndDelete: async (key) => (await getRedis()).getDel(key),
	set: async (key, value, ttl) => {
		await (await getRedis()).set(key, value, ttl ? { EX: ttl } : undefined);
	},
	delete: async (key) => {
		await (await getRedis()).del([key]);
	},
	increment: async (key, ttl) => {
		const redis = await getRedis();
		const count = await redis.incr(key);
		if (count === 1) await redis.expire(key, ttl);
		return count;
	},
};

const perHour = (max: number) => ({ window: 3600, max });

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema }),
	secondaryStorage,

	appName: site.name,
	basePath: "/api/auth",
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,

	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		revokeSessionsOnPasswordReset: true,
	},

	emailVerification: {
		sendOnSignIn: true,
	},

	user: {
		changeEmail: {
			enabled: true,
			sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
				await sendEmail({
					to: user.email,
					...emailTemplates.approveEmailChange(newEmail, url),
				});
			},
		},
	},

	rateLimit: {
		enabled: true,
		storage: "secondary-storage",
		window: 60,
		max: 100,
		customRules: {
			"/sign-in/email": { window: 60, max: 5 },
			"/sign-up/email": perHour(5),
			// email-otp limits its send, verify and reset endpoints to 3/minute.
			"/change-email": perHour(3),
		},
	},

	socialProviders,

	plugins: [
		emailOTP({
			overrideDefaultEmailVerification: true,
			disableSignUp: true,
			storeOTP: "hashed",
			async sendVerificationOTP({ email, otp, type }) {
				await sendEmail({ to: email, ...emailTemplates.code(otp, type) });
			},
		}),
		tanstackStartCookies(),
	],
});
