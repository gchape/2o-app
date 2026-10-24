import { describe, expect, it } from "vitest";
import { parseAggregateReply, parseSearchReply } from "./ft-reply";

const json = (value: object) => JSON.stringify(value);

describe("parseSearchReply", () => {
	it("reads the array form", () => {
		const reply = [
			2,
			"product:a",
			["$", json({ id: "a" })],
			"product:b",
			["$", json({ id: "b" })],
		];
		expect(parseSearchReply<{ id: string }>(reply)).toEqual({
			total: 2,
			docs: [{ id: "a" }, { id: "b" }],
		});
	});

	it("reads field lists that arrive as maps or objects", () => {
		const reply = [
			2,
			"product:a",
			new Map([["$", json({ id: "a" })]]),
			"product:b",
			{ $: json({ id: "b" }) },
		];
		expect(parseSearchReply<{ id: string }>(reply).docs).toEqual([
			{ id: "a" },
			{ id: "b" },
		]);
	});

	it("reads the GLIDE { key, value } form, with extra sort fields", () => {
		const reply = [
			2,
			[
				{
					key: "product:a",
					value: [
						{ key: "sortPrice", value: "100000000" },
						{ key: "$", value: json({ id: "a" }) },
					],
				},
				{
					key: "product:b",
					value: [{ key: "$", value: json({ id: "b" }) }],
				},
			],
		];
		expect(parseSearchReply<{ id: string }>(reply)).toEqual({
			total: 2,
			docs: [{ id: "a" }, { id: "b" }],
		});
	});

	it("reports the total even when only counting", () => {
		expect(parseSearchReply([57])).toEqual({ total: 57, docs: [] });
		expect(parseSearchReply([0, []])).toEqual({ total: 0, docs: [] });
	});

	it("fails loudly on a shape it does not know", () => {
		expect(() => parseSearchReply({ total_results: 3 })).toThrow(
			/Unexpected FT\.SEARCH reply/,
		);
	});
});

describe("parseAggregateReply", () => {
	it("returns one record per row", () => {
		expect(
			parseAggregateReply([
				2,
				["brand", "Nike", "count", "3"],
				["brand", "Adidas", "count", "1"],
			]),
		).toEqual([
			{ brand: "Nike", count: "3" },
			{ brand: "Adidas", count: "1" },
		]);
	});

	it("reads GLIDE rows without a leading count and strips index paths", () => {
		expect(
			parseAggregateReply([
				[
					{ key: "$.brand", value: "Adidas" },
					{ key: "count", value: "1" },
				],
				[
					{ key: "$.sizes[*]", value: "40" },
					{ key: "count", value: "2" },
				],
			]),
		).toEqual([
			{ brand: "Adidas", count: "1" },
			{ sizes: "40", count: "2" },
		]);
	});

	it("is empty when nothing matched", () => {
		expect(parseAggregateReply([0])).toEqual([]);
		expect(parseAggregateReply([])).toEqual([]);
	});
});
