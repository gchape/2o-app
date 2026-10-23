import { site } from "#/data/site";

// Pinned zone and locale, so the server and the browser render the same text.
const timeFormat = new Intl.DateTimeFormat("en-GB", {
	hour: "2-digit",
	minute: "2-digit",
	timeZone: site.timezone,
});

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	timeZone: site.timezone,
});

const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	timeZone: site.timezone,
});

/** `"08:00"`, in the store's own time zone, from an ISO timestamp. */
export const formatCheckedAt = (iso: string) =>
	timeFormat.format(new Date(iso));

/**
 * One sentence about the last price check, true even if the importer missed
 * today: "Prices last checked today at 08:00." / "...on 22 Oct at 08:00."
 */
export function priceCheckNote(checkedAt: string | null, now = new Date()) {
	if (!checkedAt) {
		return `New prices land every morning at ${site.priceCheckTime}.`;
	}

	const at = new Date(checkedAt);
	const when =
		dayKeyFormat.format(at) === dayKeyFormat.format(now)
			? "today"
			: `on ${shortDateFormat.format(at)}`;

	return `Prices last checked ${when} at ${formatCheckedAt(checkedAt)}.`;
}
