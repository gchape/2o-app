import { getRedis } from "#/server/redis.server";
import { parseAggregateReply, parseSearchReply } from "./ft-reply";

const run = async (args: string[]) => (await getRedis()).sendCommand(args);

type SearchOptions = {
	/** Extra clauses such as `SORTBY field ASC`; empty means relevance order. */
	sort?: string[];
	offset: number;
	limit: number;
};

/**
 * The Redis Search commands used by the storefront, sent as raw commands so
 * their RESP2 replies share the same parsers and query syntax in every caller.
 */
export const ft = {
	async list() {
		const reply = await run(["FT._LIST"]);
		if (!Array.isArray(reply)) throw new Error("Unexpected FT._LIST reply");
		return reply.map(String);
	},

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
				"DIALECT",
				"2",
			]),
		);
	},

	/** Rows produced by an aggregation pipeline, as `{ field: value }` records. */
	async aggregate(index: string, query: string, pipeline: string[]) {
		return parseAggregateReply(
			await run(["FT.AGGREGATE", index, query, ...pipeline, "DIALECT", "2"]),
		);
	},
};
