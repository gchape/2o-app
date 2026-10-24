import { describe, expect, it } from "vitest";
import { nextPageParam, pageOffset } from "./pagination";

describe("pageOffset", () => {
	it("starts the first page at zero", () => {
		expect(pageOffset(1, 48)).toBe(0);
		expect(pageOffset(3, 48)).toBe(96);
	});
});

describe("nextPageParam", () => {
	it("advances only while more pages exist", () => {
		expect(nextPageParam({ hasMore: true }, [], 2)).toBe(3);
		expect(nextPageParam({ hasMore: false }, [], 2)).toBeUndefined();
	});
});
