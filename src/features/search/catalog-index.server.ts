import { createHash } from "node:crypto";
import { Batch } from "@valkey/valkey-glide";
import { db } from "#/db";
import { getValkey } from "#/server/valkey.server";
import { buildCatalogDocs } from "./catalog-doc";
import { schemaArgs } from "./catalog-fields";
import { MATCH_ALL } from "./catalog-query";
import { ft } from "./valkey-ft.server";

const FAMILY = "catalog_";
const KEY_PREFIX = "product:";

/** Named after its schema, so changing `FIELDS` simply creates a new index. */
export const INDEX = `${FAMILY}${createHash("sha1")
	.update(schemaArgs().join("|"))
	.digest("hex")
	.slice(0, 8)}`;

let indexReady: Promise<void> | undefined;

async function createIndex() {
	const existing = await ft.list();
	if (!existing.includes(INDEX)) {
		await ft.create(INDEX, KEY_PREFIX, schemaArgs());
	}
	// Indexes from an older schema only cost memory.
	await Promise.all(
		existing
			.filter((name) => name.startsWith(FAMILY) && name !== INDEX)
			.map((name) => ft.dropIndex(name)),
	);
}

const ensureIndex = () => {
	indexReady ??= createIndex().catch((error: unknown) => {
		indexReady = undefined;
		throw error;
	});
	return indexReady;
};

/** Deletes indexed products that are no longer in the catalogue. */
async function removeStaleKeys(live: ReadonlySet<string>) {
	const valkey = await getValkey();
	let cursor = "0";
	do {
		const [next, keys] = await valkey.scan(cursor, {
			match: `${KEY_PREFIX}*`,
			count: 1_000,
		});
		cursor = String(next);
		const stale = keys.map(String).filter((key) => !live.has(key));
		if (stale.length > 0) await valkey.del(stale);
	} while (cursor !== "0");
}

/**
 * Rebuilds the search index from Postgres and returns how many products it
 * holds. Safe to run any time and as often as you like: it overwrites in place.
 */
export async function syncCatalogIndex() {
	await ensureIndex();

	const rows = await db.query.product.findMany({
		columns: {
			id: true,
			slug: true,
			name: true,
			brand: true,
			department: true,
			category: true,
			currency: true,
		},
		with: {
			skus: {
				where: { inStock: true },
				columns: {
					color: true,
					size: true,
					price: true,
					originalPrice: true,
					discount: true,
					imageUrl: true,
				},
			},
		},
	});

	const docs = buildCatalogDocs(rows);
	const valkey = await getValkey();

	for (let i = 0; i < docs.length; i += 500) {
		const batch = new Batch(false);
		for (const doc of docs.slice(i, i + 500)) {
			batch.customCommand([
				"JSON.SET",
				KEY_PREFIX + doc.id,
				"$",
				JSON.stringify(doc),
			]);
		}
		await valkey.exec(batch, true);
	}

	await removeStaleKeys(new Set(docs.map((doc) => KEY_PREFIX + doc.id)));
	return docs.length;
}

let catalogReady: Promise<void> | undefined;

/**
 * Every search goes through here. It creates the index, and if Valkey came up
 * empty (a fresh volume, a lost disk) it refills it from Postgres, so the
 * storefront heals itself instead of showing an empty catalogue.
 */
export const ensureCatalogReady = () => {
	catalogReady ??= (async () => {
		await ensureIndex();
		const { total } = await ft.search(INDEX, MATCH_ALL, {
			offset: 0,
			limit: 0,
		});
		if (total === 0) await syncCatalogIndex();
	})().catch((error: unknown) => {
		catalogReady = undefined;
		throw error;
	});
	return catalogReady;
};
