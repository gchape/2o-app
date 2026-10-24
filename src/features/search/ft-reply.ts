/**
 * Turning raw FT.SEARCH / FT.AGGREGATE replies into data. Kept free of server
 * imports so it can be tested with fabricated replies.
 */

const unexpected = (command: string, reply: unknown) =>
	new Error(
		`Unexpected ${command} reply: ${JSON.stringify(reply)?.slice(0, 300)}`,
	);

type Entry = { key: unknown; value: unknown };

const isEntry = (item: unknown): item is Entry =>
	typeof item === "object" && item !== null && "key" in item && "value" in item;

/**
 * A field list arrives as `[k, v, k, v]`, as `[{ key, value }, ...]` (what
 * GLIDE returns for RESP3 maps), or as a Map / plain object.
 */
function toRecord(fields: unknown): Record<string, string> {
	if (Array.isArray(fields)) {
		const record: Record<string, string> = {};
		if (fields.length > 0 && fields.every(isEntry)) {
			for (const { key, value } of fields) record[String(key)] = String(value);
			return record;
		}
		for (let i = 0; i + 1 < fields.length; i += 2) {
			record[String(fields[i])] = String(fields[i + 1]);
		}
		return record;
	}
	if (fields instanceof Map) {
		return Object.fromEntries(
			[...fields].map(([key, value]) => [String(key), String(value)]),
		);
	}
	if (fields && typeof fields === "object") {
		return Object.fromEntries(
			Object.entries(fields).map(([key, value]) => [key, String(value)]),
		);
	}
	return {};
}

/**
 * `[total, key, fields, key, fields, ...]`, or the GLIDE form
 * `[total, [{ key, value: fields }, ...]]`. JSON documents live under `$`.
 */
export function parseSearchReply<T>(reply: unknown) {
	const total = Array.isArray(reply) ? Number(reply[0]) : Number.NaN;
	if (!Array.isArray(reply) || !Number.isFinite(total)) {
		throw unexpected("FT.SEARCH", reply);
	}

	const rest = reply.slice(1);
	const first = rest[0];
	const hits: Array<[unknown, unknown]> =
		rest.length === 1 && Array.isArray(first) && first.every(isEntry)
			? first.map((entry): [unknown, unknown] => [entry.key, entry.value])
			: Array.from(
					{ length: Math.floor(rest.length / 2) },
					(_, i): [unknown, unknown] => [rest[i * 2], rest[i * 2 + 1]],
				);

	const docs: T[] = [];
	for (const [, fields] of hits) {
		const json = toRecord(fields).$;
		if (json) docs.push(JSON.parse(json) as T);
	}
	return { total, docs };
}

/** Field names come back as index paths (`$.brand`, `$.sizes[*]`); strip them to the alias-style name. */
const cleanKey = (key: string) =>
	key.replace(/^\$\./, "").replace(/\[\*\]$/, "");

/** One record per row, with or without a leading count. */
export function parseAggregateReply(reply: unknown) {
	if (!Array.isArray(reply)) throw unexpected("FT.AGGREGATE", reply);
	const rows = typeof reply[0] === "number" ? reply.slice(1) : reply;
	return rows.map((row) =>
		Object.fromEntries(
			Object.entries(toRecord(row)).map(([key, value]) => [
				cleanKey(key),
				value,
			]),
		),
	);
}
