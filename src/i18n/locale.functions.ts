import { createServerFn } from "@tanstack/react-start";
import {
	getCookie,
	getRequest,
	setCookie,
	setResponseHeader,
} from "@tanstack/react-start/server";
import { z } from "zod";
import { DEFAULT_LOCALE } from "./locale";

const localeSchema = z.enum(["ka", "en"]);
const COOKIE_NAME = "2o-locale";

export const getLocaleFn = createServerFn({ method: "GET" }).handler(() => {
	setResponseHeader("Cache-Control", "private, no-store");
	return localeSchema.safeParse(getCookie(COOKIE_NAME)).data ?? DEFAULT_LOCALE;
});

export const setLocaleFn = createServerFn({ method: "POST" })
	.validator(localeSchema)
	.handler(({ data }) => {
		setCookie(COOKIE_NAME, data, {
			path: "/",
			maxAge: 60 * 60 * 24 * 365,
			httpOnly: true,
			sameSite: "lax",
			secure: new URL(getRequest().url).protocol === "https:",
		});
		return data;
	});
