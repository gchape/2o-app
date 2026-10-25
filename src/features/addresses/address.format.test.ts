import { describe, expect, it } from "vitest";
import { formatAddress } from "./address.format";

const row = {
	fullName: "Nino Beridze",
	phone: "+995 555 12 34 56",
	line1: "21-A Brookside Dr.",
	line2: "TBS-1445995",
	city: "Wilmington",
	state: "DE",
	postalCode: "19804",
	country: "United States",
};

describe("formatAddress", () => {
	it("joins the street lines and the locality", () => {
		expect(formatAddress(row)).toEqual({
			street: "21-A Brookside Dr., TBS-1445995",
			locality: "Wilmington, DE 19804, United States",
		});
	});

	it("skips what is missing without leaving stray separators", () => {
		expect(formatAddress({ ...row, line2: null })).toEqual({
			street: "21-A Brookside Dr.",
			locality: "Wilmington, DE 19804, United States",
		});
	});
});
