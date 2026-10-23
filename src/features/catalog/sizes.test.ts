import { describe, expect, it } from "vitest";
import { compareSizes, sortSkus } from "./sizes";

describe("compareSizes", () => {
	it("orders shoe sizes numerically, not lexically", () => {
		const sizes = ["9", "10", "38.5", "38"].toSorted((a, b) =>
			compareSizes("shoes", a, b),
		);
		expect(sizes).toEqual(["9", "10", "38", "38.5"]);
	});

	it("orders clothing sizes along the size scale", () => {
		const sizes = ["xl", "S", "xxs", "2XL", "m"].toSorted((a, b) =>
			compareSizes("clothing", a, b),
		);
		expect(sizes).toEqual(["xxs", "S", "m", "xl", "2XL"]);
	});

	it("puts unknown clothing sizes last", () => {
		const sizes = ["One Size", "m", "xs"].toSorted((a, b) =>
			compareSizes("clothing", a, b),
		);
		expect(sizes).toEqual(["xs", "m", "One Size"]);
	});
});

describe("sortSkus", () => {
	it("groups by color and then sorts sizes, without mutating the input", () => {
		const skus = [
			{ color: "red", size: "10" },
			{ color: "black", size: "9" },
			{ color: "red", size: "9" },
		];
		expect(sortSkus(skus, "shoes")).toEqual([
			{ color: "black", size: "9" },
			{ color: "red", size: "9" },
			{ color: "red", size: "10" },
		]);
		expect(skus[0]).toEqual({ color: "red", size: "10" });
	});
});
