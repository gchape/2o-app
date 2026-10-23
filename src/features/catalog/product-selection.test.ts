import { describe, expect, it } from "vitest";
import { resolveSelection, type SelectableSku } from "./product-selection";

const sku = (overrides: Partial<SelectableSku>): SelectableSku => ({
	id: "id",
	color: "black",
	size: "40",
	imageUrl: null,
	price: 100,
	originalPrice: null,
	inStock: true,
	...overrides,
});

const skus = [
	sku({ id: "b40", color: "black", size: "40", price: 120 }),
	sku({ id: "b41", color: "black", size: "41", price: 100 }),
	sku({ id: "b42", color: "black", size: "42", inStock: false }),
	sku({ id: "w40", color: "white", size: "40", imageUrl: "/white.webp" }),
];

describe("resolveSelection", () => {
	it("defaults to the first color with stock and its cheapest SKU", () => {
		const s = resolveSelection(skus, {});
		expect(s.color).toBe("black");
		expect(s.selected).toBeUndefined();
		expect(s.shown?.id).toBe("b41");
	});

	it("honours a valid color and size", () => {
		const s = resolveSelection(skus, { color: "white", sku: "w40" });
		expect(s.color).toBe("white");
		expect(s.selected?.id).toBe("w40");
		expect(s.imageUrl).toBe("/white.webp");
	});

	it("falls back when the URL names an unknown color", () => {
		expect(resolveSelection(skus, { color: "pink" }).color).toBe("black");
	});

	it("ignores sold-out and cross-color SKUs", () => {
		expect(resolveSelection(skus, { sku: "b42" }).selected).toBeUndefined();
		expect(
			resolveSelection(skus, { color: "white", sku: "b40" }).selected,
		).toBeUndefined();
	});

	it("handles a product with no SKUs", () => {
		const s = resolveSelection([], {});
		expect(s.shown).toBeUndefined();
		expect(s.colors).toEqual([]);
	});
});
