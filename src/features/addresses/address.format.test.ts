import { describe, expect, it } from "vitest";
import { formatAddress } from "./address.format";

const row = {
	fullName: "Nino Beridze",
	phone: "+995 555 12 34 56",
	line1: "12 Rustaveli Ave",
	line2: "Apt 4",
	city: "Tbilisi",
	postalCode: "0108",
	country: "Georgia",
};

describe("formatAddress", () => {
	it("joins the street lines and the locality", () => {
		expect(formatAddress(row)).toEqual({
			street: "12 Rustaveli Ave, Apt 4",
			locality: "0108 Tbilisi, Georgia",
		});
	});

	it("skips what is missing without leaving stray separators", () => {
		expect(formatAddress({ ...row, line2: null, postalCode: null })).toEqual({
			street: "12 Rustaveli Ave",
			locality: "Tbilisi, Georgia",
		});
	});
});
