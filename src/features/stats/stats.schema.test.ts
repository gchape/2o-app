import { describe, expect, it } from "vitest";
import { statsSchema } from "./stats.schema";

describe("statsSchema", () => {
	it("accepts what getStats produces", () => {
		const stats = { deals: 12, warehouses: 3, checkedAt: null };
		expect(statsSchema.parse(stats)).toEqual(stats);
	});

	it("rejects a malformed cache entry", () => {
		expect(statsSchema.safeParse({ deals: "12" }).success).toBe(false);
		expect(
			statsSchema.safeParse({ deals: -1, warehouses: 0, checkedAt: null })
				.success,
		).toBe(false);
	});
});
