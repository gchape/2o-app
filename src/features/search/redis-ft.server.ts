import type { createClient, FtSearchOptions } from "redis";
import { getRedis } from "#/server/redis.server";

type SearchOptions = {
	sort?: FtSearchOptions["SORTBY"];
	offset: number;
	limit: number;
};

type AggregateOptions = NonNullable<
	Parameters<ReturnType<typeof createClient>["ft"]["aggregate"]>[2]
>;

/** Catalog Search operations; the Redis client owns command and reply encoding. */
export const ft = {
	list: async () => (await getRedis()).ft._list(),

	// The same schema arguments also determine the index's version hash.
	create: async (index: string, prefix: string, schema: string[]) =>
		(await getRedis()).sendCommand([
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

	dropIndex: async (index: string) => (await getRedis()).ft.dropIndex(index),

	async search<T>(index: string, query: string, options: SearchOptions) {
		const { total, documents } = await (await getRedis()).ft.search(
			index,
			query,
			{
				RETURN: "$",
				SORTBY: options.sort,
				LIMIT: { from: options.offset, size: options.limit },
				DIALECT: 2,
			},
		);
		return { total, docs: documents.map(({ value }) => value as T) };
	},

	async aggregate(index: string, query: string, options: AggregateOptions) {
		const { results } = await (await getRedis()).ft.aggregate(index, query, {
			...options,
			DIALECT: 2,
		});
		return results;
	},
};
