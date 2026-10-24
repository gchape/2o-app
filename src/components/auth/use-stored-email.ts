import { useHydrated } from "@tanstack/react-router";

/** Reads the email saved by the preceding auth view, once client storage is available. */
export function useStoredEmail(key: string) {
	const hydrated = useHydrated();
	if (!hydrated) return "";
	try {
		return sessionStorage.getItem(key) ?? "";
	} catch {
		// Browsers may disable storage; the confirmation view should still render.
		return "";
	}
}
