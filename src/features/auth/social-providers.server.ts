import { env } from "#/server/env.server";

type Credentials = { clientId: string; clientSecret: string };

const credentials = (
	clientId?: string,
	clientSecret?: string,
): Credentials | undefined =>
	clientId && clientSecret ? { clientId, clientSecret } : undefined;

const google = credentials(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
const facebook = credentials(
	env.FACEBOOK_CLIENT_ID,
	env.FACEBOOK_CLIENT_SECRET,
);

/** Only providers that have credentials; the rest are neither enabled nor shown. */
export const socialProviders = {
	...(google && { google }),
	...(facebook && { facebook }),
};

export const enabledSocialProviders = Object.keys(socialProviders) as Array<
	keyof typeof socialProviders
>;
