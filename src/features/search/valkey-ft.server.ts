import { Decoder } from "@valkey/valkey-glide";
import { getValkey } from "#/server/valkey.server";
import { parseAggregateReply, parseSearchReply } from "./ft-reply";

const run = async (args: string[]) =>
	(await getValkey()).customCommand(args, { decoder: Decoder.String });

type SearchOptions = {
	/** Extra clauses such as `SORTBY field ASC`; empty means relevance order. */
	sort?: string[];
	offset: number;
	limit: number;
};

/**
 * The few Valkey Search commands the storefront uses, as typed calls. GLIDE has
 * no typed API for sorting, so they go out as plain commands; this is the one
 * place that knows their syntax.
 */
export const ft = {
	list: async () => ((await run(["FT._LIST"])) as unknown[]).map(String),

	create: (index: string, prefix: string, schema: string[]) =>
		run([
			"FT.CREATE",
			index,
			"ON",
			"JSON",
			"PREFIX",
			"1",
			prefix,
			"SCHEMA",
			...schema,
		]),

	dropIndex: (index: string) => run(["FT.DROPINDEX", index]),

	/** One page of JSON documents plus the total number of matches. */
	async search<T>(index: string, query: string, options: SearchOptions) {
		return parseSearchReply<T>(
			await run([
				"FT.SEARCH",
				index,
				query,
				"RETURN",
				"1",
				"$",
				...(options.sort ?? []),
				"LIMIT",
				String(options.offset),
				String(options.limit),
			]),
		);
	},

	/** Rows produced by an aggregation pipeline, as `{ field: value }` records. */
	async aggregate(index: string, query: string, pipeline: string[]) {
		return parseAggregateReply(
			await run(["FT.AGGREGATE", index, query, ...pipeline]),
		);
	},
};
