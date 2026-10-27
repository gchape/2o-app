import { describe, expect, it } from "vitest";
import { buildCatalogDocs, type SourceProduct } from "./catalog-doc";

const product = (overrides: Partial<SourceProduct>): SourceProduct => ({
	id: "p",
	storeId: "a".repeat(64),
	slug: "p",
	name: "Product",
	brand: "Nike",
	department: "men",
	category: "shoes",
	currency: "GEL",
	skus: [],
	...overrides,
});

const sku = (
	overrides: Partial<SourceProduct["skus"][number]> = {},
): SourceProduct["skus"][number] => ({
	color: "black",
	size: "40",
	price: 100,
	originalPrice: null,
	discount: 0,
	imageUrl: null,
	...overrides,
});

describe("buildCatalogDocs", () => {
	it("leaves out products with nothing in stock", () => {
		const docs = buildCatalogDocs([
			product({ id: "a", skus: [sku()] }),
			product({ id: "b", skus: [] }),
		]);
		expect(docs.map((d) => d.id)).toEqual(["a"]);
	});

	it("prices a listing at the cheapest SKU and a deal at the deepest discount", () => {
		const [doc] = buildCatalogDocs([
			product({
				skus: [
					sku({ size: "40", price: 5000 }),
					sku({ size: "41", price: 8000, originalPrice: 16000, discount: 50 }),
				],
			}),
		]);
		expect(doc?.price).toBe(5000);
		expect(doc?.discount).toBe(50);
		expect(doc?.deal).toEqual({
			price: 8000,
			originalPrice: 16000,
			imageUrl: null,
		});
	});

	it("has no deal when nothing is discounted", () => {
		const [doc] = buildCatalogDocs([product({ skus: [sku()] })]);
		expect(doc?.deal).toBeNull();
		expect(doc?.discount).toBe(0);
	});

	it("collects distinct colors and sizes as comma-separated tags, and searches brand and name together", () => {
		const [doc] = buildCatalogDocs([
			product({
				name: "Air Runner",
				skus: [
					sku({ color: "black", size: "40" }),
					sku({ color: "black", size: "41" }),
					sku({ color: "white", size: "40" }),
				],
			}),
		]);
		expect(doc?.colors).toBe("black,white");
		expect(doc?.sizes).toBe("40,41");
		expect(doc?.searchText).toBe("Nike Air Runner");
	});

	it("keeps commas inside a value from splitting it into two tags", () => {
		const [doc] = buildCatalogDocs([
			product({ skus: [sku({ color: "red, blue" })] }),
		]);
		expect(doc?.colors).toBe("red  blue");
	});

	it("omits a missing brand instead of writing null", () => {
		const [doc] = buildCatalogDocs([product({ brand: null, skus: [sku()] })]);
		expect(JSON.parse(JSON.stringify(doc))).not.toHaveProperty("brand");
		expect(doc?.searchText).toBe("Product");
	});

	it("gives every product a unique sort key, even when prices tie", () => {
		const docs = buildCatalogDocs(
			["a", "b", "c"].map((id) =>
				product({ id, name: "Same", skus: [sku({ price: 100 })] }),
			),
		);
		for (const key of ["name", "price", "dealPrice", "discount"] as const) {
			expect(new Set(docs.map((d) => d.sort[key])).size).toBe(3);
		}
	});

	it("orders deals independently of the cheapest variant", () => {
		const docs = buildCatalogDocs([
			product({
				id: "a",
				storeId: "a".repeat(64),
				skus: [
					sku({ price: 1000 }),
					sku({ price: 8000, originalPrice: 16000, discount: 50 }),
				],
			}),
			product({
				id: "b",
				storeId: "a".repeat(64),
				skus: [sku({ price: 5000, originalPrice: 10000, discount: 50 })],
			}),
		]);
		expect(
			docs.toSorted((a, b) => a.sort.price - b.sort.price).map((doc) => doc.id),
		).toEqual(["a", "b"]);
		expect(
			docs
				.toSorted((a, b) => a.sort.dealPrice - b.sort.dealPrice)
				.map((doc) => doc.id),
		).toEqual(["b", "a"]);
	});

	it("ranks names alphabetically", () => {
		const docs = buildCatalogDocs([
			product({ id: "1", name: "Zed", skus: [sku()] }),
			product({ id: "2", name: "Alpha", skus: [sku()] }),
		]);
		const byName = docs.toSorted((a, b) => a.sort.name - b.sort.name);
		expect(byName.map((d) => d.name)).toEqual(["Alpha", "Zed"]);
	});
});
