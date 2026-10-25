import { describe, expect, it } from "vitest";
import { formatCheckedAt, priceCheckNote } from "./format-checked-at";

// Asia/Tbilisi is UTC+4 all year.
describe("formatCheckedAt", () => {
	it("renders the time in the store's zone", () => {
		expect(formatCheckedAt("2026-10-23T04:00:00Z")).toBe("08:00");
		expect(formatCheckedAt("2026-10-22T20:30:00Z")).toBe("00:30");
	});
});

describe("priceCheckNote", () => {
	const now = new Date("2026-10-23T09:00:00Z");
	it("can still render English when requested", () => {
		expect(priceCheckNote("2026-10-22T04:05:00Z", now, "en")).toBe(
			"Prices last checked on 22 Oct at 08:05.",
		);
	});

	it("says today when the check ran on the store's current day", () => {
		expect(priceCheckNote("2026-10-23T04:05:00Z", now)).toBe(
			"ფასები ბოლოს შემოწმდა დღეს, 08:05 საათზე.",
		);
	});

	it("names the date when the last check is older", () => {
		expect(priceCheckNote("2026-10-22T04:05:00Z", now)).toBe(
			"ფასები ბოლოს შემოწმდა 22 ოქტ, 08:05 საათზე.",
		);
	});

	it("compares days in the store's zone, not UTC", () => {
		// 21:00 UTC on the 22nd is 01:00 on the 23rd in Tbilisi.
		expect(priceCheckNote("2026-10-22T21:00:00Z", now)).toBe(
			"ფასები ბოლოს შემოწმდა დღეს, 01:00 საათზე.",
		);
	});

	it("falls back to the schedule before the first run", () => {
		expect(priceCheckNote(null, now)).toBe(
			"ახალი ფასები ყოველ დილით, 08:00 საათზე გამოჩნდება.",
		);
	});
});
