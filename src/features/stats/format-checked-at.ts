import { site } from "#/data/site";
import { DEFAULT_LOCALE, type Locale, languageTags } from "#/i18n/locale";
import { translate } from "#/i18n/translate";

// Pinned zone and 24-hour clock, so server and browser render the same time.
const timeFormat = new Intl.DateTimeFormat("ka-GE", {
	hour: "2-digit",
	minute: "2-digit",
	hourCycle: "h23",
	timeZone: site.timezone,
});
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	timeZone: site.timezone,
});

/** `"08:00"`, in the store's own time zone, from an ISO timestamp. */
export const formatCheckedAt = (iso: string) =>
	timeFormat.format(new Date(iso));

/** Reports the actual last check, even if the importer missed today. */
export function priceCheckNote(
	checkedAt: string | null,
	now = new Date(),
	locale: Locale = DEFAULT_LOCALE,
) {
	if (!checkedAt) {
		return translate(
			"New prices land every morning at {{time}}.",
			{
				time: site.priceCheckTime,
			},
			locale,
		);
	}
	const at = new Date(checkedAt);
	const time = formatCheckedAt(checkedAt);
	if (dayKeyFormat.format(at) === dayKeyFormat.format(now)) {
		return translate(
			"Prices last checked today at {{time}}.",
			{ time },
			locale,
		);
	}
	const date = new Intl.DateTimeFormat(
		locale === "en" ? "en-GB" : languageTags[locale],
		{
			day: "numeric",
			month: "short",
			timeZone: site.timezone,
		},
	).format(at);
	return translate(
		"Prices last checked on {{date}} at {{time}}.",
		{ date, time },
		locale,
	);
}
