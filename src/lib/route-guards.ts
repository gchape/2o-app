import { notFound } from "@tanstack/react-router";
import type { z } from "zod";

/** Parses a route param (or any untrusted value) and turns failures into a 404. */
export function parseParam<S extends z.ZodType>(
	schema: S,
	value: unknown,
): z.output<S> {
	const { success, data } = schema.safeParse(value);
	if (!success) throw notFound();
	return data;
}
