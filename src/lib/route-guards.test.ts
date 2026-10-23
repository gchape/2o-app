import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseParam } from "./route-guards";

const schema = z.enum(["men", "women"]);

describe("parseParam", () => {
	it("returns the parsed value", () => {
		expect(parseParam(schema, "men")).toBe("men");
	});

	it("turns a bad value into a 404", () => {
		let thrown: unknown;
		try {
			parseParam(schema, "dogs");
		} catch (error) {
			thrown = error;
		}
		expect(thrown).toMatchObject({ isNotFound: true });
	});
});
