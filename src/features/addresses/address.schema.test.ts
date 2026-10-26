import { describe, expect, it } from "vitest";
import { addressSchema } from "./address.schema";

const valid = {
	fullName: "Nino Beridze",
	phone: "+995 555 12 34 56",
	line1: "12 Rustaveli Ave",
	line2: "",
	city: "Tbilisi",
	state: "DE",
	postalCode: "19804",
	country: "United States",
	isPrimary: false,
};

const messages = (input: unknown) =>
	addressSchema.safeParse(input).error?.issues.map((issue) => issue.message);

describe("addressSchema", () => {
	it("accepts a complete address and leaves the optional fields empty", () => {
		expect(addressSchema.parse(valid)).toEqual(valid);
	});

	it("trims every text field", () => {
		const parsed = addressSchema.parse({
			...valid,
			fullName: "  Nino Beridze ",
			city: " Tbilisi  ",
			state: " DE ",
			country: " United States ",
			postalCode: " 19804 ",
			line2: "  Apt 4 ",
		});
		expect(parsed).toMatchObject({
			fullName: "Nino Beridze",
			city: "Tbilisi",
			line2: "Apt 4",
			state: "DE",
			country: "United States",
			postalCode: "19804",
		});
	});

	it("requires a name, street and city, with a message that says which", () => {
		expect(messages({ ...valid, fullName: "  " })).toEqual([
			"შეიყვანეთ მიმღების სახელი",
		]);
		expect(messages({ ...valid, line1: "" })).toEqual([
			"შეიყვანეთ ქუჩა და სახლის ნომერი",
		]);
		expect(messages({ ...valid, city: "" })).toEqual(["შეიყვანეთ ქალაქი"]);
	});

	it("requires state, ZIP, and country", () => {
		for (const [field, message] of [
			["state", "შეიყვანეთ შტატი ან რეგიონი"],
			["postalCode", "შეიყვანეთ საფოსტო ინდექსი"],
			["country", "შეიყვანეთ ქვეყანა"],
		] as const) {
			expect(messages({ ...valid, [field]: "  " })).toEqual([message]);
		}
	});

	it("accepts common phone formats and rejects the rest", () => {
		for (const phone of [
			"555123456",
			"+1 (302) 691 0017",
			"+995 (555) 12-34-56",
			"032 2 12 34 56",
		]) {
			expect(addressSchema.safeParse({ ...valid, phone }).success).toBe(true);
		}
		for (const phone of ["", "abc", "12345", "+(((  )))", "5".repeat(31)]) {
			expect(messages({ ...valid, phone })).toEqual([
				"შეიყვანეთ ტელეფონის სწორი ნომერი",
			]);
		}
	});

	it("caps lengths", () => {
		expect(
			addressSchema.safeParse({ ...valid, fullName: "a".repeat(101) }).success,
		).toBe(false);
		expect(
			addressSchema.safeParse({ ...valid, postalCode: "1".repeat(21) }).success,
		).toBe(false);
	});

	it("needs an explicit primary flag", () => {
		const { isPrimary: _omitted, ...withoutFlag } = valid;
		expect(addressSchema.safeParse(withoutFlag).success).toBe(false);
	});
});
