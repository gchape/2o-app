/**
 * Copy for the parts of the UI that Better Auth UI's own `localization` does
 * not cover (the email-code flows and shared form messages).
 *
 * Add translations using the `Messages` type and pass them to `Providers`
 * alongside Better Auth UI's `localization`. Resolve both from the same locale
 * on the server and client so hydration uses identical copy.
 */
import { createContext, useContext } from "react";

import type { Messages } from "./en";
import { ka } from "./ka";

export { en, type Messages } from "./en";
export { ka } from "./ka";

/** Replaces `{{name}}` placeholders, the syntax Better Auth UI's own strings use. */
export function fill(
	template: string,
	values: Record<string, string | number>,
) {
	return template.replace(/\{\{(\w+)\}\}/g, (placeholder, key: string) =>
		String(values[key] ?? placeholder),
	);
}

const MessagesContext = createContext<Messages>(ka);
export const MessagesProvider = MessagesContext.Provider;

/** Request-local copy, with Georgian as the default. */
export const useMessages = () => useContext(MessagesContext);
