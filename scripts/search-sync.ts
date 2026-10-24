/**
 * Rebuilds the Redis search index from Postgres.
 *
 *   pnpm search:sync
 *
 * Run it after the importer. The index also refills itself when Redis comes
 * up empty, so this is for picking up fresh prices, not for recovery.
 */
import "dotenv/config"; // must run before #/db reads process.env
import { syncCatalogIndex } from "#/features/search/catalog-index.server";

try {
	console.log(`Indexed ${await syncCatalogIndex()} products.`);
	process.exit(0);
} catch (error) {
	console.error(error);
	process.exit(1);
}
