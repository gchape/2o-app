import {
	getCookie,
	getRequest,
	setCookie,
	setResponseHeader,
} from "@tanstack/react-start/server";
import { beforeEach, expect, it, vi } from "vitest";
import { getLocaleFn, setLocaleFn } from "./locale.functions";

// Exercise handlers and input validation without starting the HTTP server.
vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => {
		let parse = (value: unknown) => value;
		const builder = {
			validator: (schema: { parse: typeof parse }) => {
				parse = (value) => schema.parse(value);
				return builder;
			},
			handler:
				(handler: (context: { data: unknown }) => unknown) =>
				async (options?: { data: unknown }) =>
					handler({ data: parse(options?.data) }),
		};
		return builder;
	},
}));
vi.mock("@tanstack/react-start/server", () => ({
	getCookie: vi.fn(),
	getRequest: vi.fn(),
	setCookie: vi.fn(),
	setResponseHeader: vi.fn(),
}));

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(getRequest).mockReturnValue(new Request("https://example.com/"));
});

it.each([undefined, "invalid", "EN"])(
	"defaults to Georgian for cookie %s",
	async (cookie) => {
		vi.mocked(getCookie).mockReturnValue(cookie);
		expect(await getLocaleFn()).toBe("ka");
	},
);

it.each(["ka", "en"] as const)(
	"persists and reads %s on the next request",
	async (locale) => {
		await setLocaleFn({ data: locale });
		expect(setCookie).toHaveBeenCalledWith("2o-locale", locale, {
			path: "/",
			maxAge: 31536000,
			httpOnly: true,
			sameSite: "lax",
			secure: true,
		});
		vi.mocked(getCookie).mockReturnValue(locale);
		expect(await getLocaleFn()).toBe(locale);
		expect(setResponseHeader).toHaveBeenCalledWith(
			"Cache-Control",
			"private, no-store",
		);
	},
);

it("rejects unsupported language input without writing a cookie", async () => {
	// @ts-expect-error Check untrusted HTTP input beyond the TypeScript boundary.
	await expect(setLocaleFn({ data: "fr" })).rejects.toThrow();
	expect(setCookie).not.toHaveBeenCalled();
});
