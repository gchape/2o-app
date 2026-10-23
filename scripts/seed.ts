/**
 * Fills a development database with fake products and SKUs.
 *
 *   pnpm db:seed
 *
 * Every seeded product lives under a reserved `.example` warehouse domain, so
 * re-running replaces the previous seed and never touches real imported data.
 */
import "dotenv/config"; // must run before #/db reads process.env
import { like } from "drizzle-orm";
import {
	type Category,
	categorySlugs,
	type Department,
	departmentSlugs,
} from "#/data/catalog";
import { db } from "#/db";
import { product, skus } from "#/db/schema";
import { refreshStats } from "#/features/stats/stats.server";

if (process.env.NODE_ENV === "production") {
	console.error("Refusing to seed a production database.");
	process.exit(1);
}

const SEED_URL_PATTERN = "https://%.example/%";
const PRODUCTS_PER_GROUP = 8;

const warehouses = [
	"sportmax.example",
	"urbanfit.example",
	"kidzone.example",
	"shoebox.example",
];

const brands = ["Nike", "Adidas", "Puma", "New Balance", "Reebok", "Asics"];

const models: Record<Category, string[]> = {
	shoes: [
		"Air Runner",
		"Court Classic",
		"Trail Pro",
		"Street Low",
		"Cloud Flex",
		"Retro 90",
		"Pace Max",
		"Terra Grip",
	],
	clothing: [
		"Essential Hoodie",
		"Performance Tee",
		"Training Shorts",
		"Zip Jacket",
		"Everyday Joggers",
		"Club Polo",
		"Windbreaker",
		"Fleece Crew",
	],
};

const colors = [
	{ name: "black", hex: "#171717" },
	{ name: "white", hex: "#e5e5e5" },
	{ name: "navy", hex: "#1e3a8a" },
	{ name: "red", hex: "#b91c1c" },
	{ name: "grey", hex: "#737373" },
	{ name: "green", hex: "#166534" },
];

const sizes: Record<Category, Record<Department, string[]>> = {
	shoes: {
		men: ["40", "41", "42", "43", "44", "45", "46"],
		women: ["36", "37", "38", "39", "40", "41"],
		kids: ["28", "30", "32", "34", "35"],
	},
	clothing: {
		men: ["s", "m", "l", "xl", "2xl"],
		women: ["xs", "s", "m", "l", "xl"],
		kids: ["xs", "s", "m", "l"],
	},
};

/** Price range in tetri (minor units of the GEL). */
const priceRange: Record<Category, [number, number]> = {
	shoes: [8_000, 40_000],
	clothing: [3_000, 20_000],
};

/** Small deterministic PRNG so every run produces the same catalogue. */
function mulberry32(seed: number) {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const random = mulberry32(2026);
const int = (min: number, max: number) =>
	min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[]): T =>
	items[int(0, items.length - 1)] as T;
const shuffle = <T>(items: readonly T[]) =>
	items.toSorted(() => random() - 0.5);

const slugify = (text: string) =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

/** A flat colour tile with the product name, so cards look real without photos. */
function placeholderImage(label: string, hex: string) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="${hex}"/><text x="200" y="260" fill="white" fill-opacity="0.85" font-family="sans-serif" font-size="26" font-weight="700" text-anchor="middle">${label}</text></svg>`;
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

type ProductRow = typeof product.$inferInsert;
type SkuRow = Omit<typeof skus.$inferInsert, "productId">;

function buildCatalogue() {
	const rows: { product: ProductRow; skus: SkuRow[] }[] = [];

	for (const department of departmentSlugs) {
		for (const category of categorySlugs) {
			const names = shuffle(models[category]).slice(0, PRODUCTS_PER_GROUP);

			for (const [index, model] of names.entries()) {
				const brand = pick(brands);
				const name = `${brand} ${model}`;
				const slug = slugify(`${name} ${department} ${category} ${index + 1}`);
				const warehouse = pick(warehouses);

				const [minPrice, maxPrice] = priceRange[category];
				const originalPrice = Math.round(int(minPrice, maxPrice) / 100) * 100;
				// About two thirds of products are discounted by 10-60%.
				const onSale = random() < 0.66;
				const price = onSale
					? Math.round((originalPrice * (100 - int(10, 60))) / 10_000) * 100
					: originalPrice;

				const productColors = shuffle(colors).slice(0, int(1, 3));
				const productSizes = sizes[category][department];

				const skuRows = productColors.flatMap((color) =>
					productSizes.map((size) => ({
						color: color.name,
						size,
						imageUrl: placeholderImage(name, color.hex),
						price,
						originalPrice: onSale ? originalPrice : null,
						inStock: random() > 0.2,
					})),
				);
				// A product with nothing in stock would never show up anywhere.
				if (skuRows.length > 0 && !skuRows.some((sku) => sku.inStock)) {
					(skuRows[0] as SkuRow).inStock = true;
				}

				rows.push({
					product: {
						url: `https://www.${warehouse}/p/${slug}`,
						slug,
						name,
						brand,
						description: `${name}: a ${category === "shoes" ? "pair of shoes" : "piece of clothing"} for ${department === "kids" ? "kids" : department}. Demo data.`,
						department,
						category,
					},
					skus: skuRows,
				});
			}
		}
	}

	return rows;
}

async function seed() {
	const catalogue = buildCatalogue();

	await db.transaction(async (tx) => {
		await tx.delete(product).where(like(product.url, SEED_URL_PATTERN));

		const inserted = await tx
			.insert(product)
			.values(catalogue.map((entry) => entry.product))
			.returning({ id: product.id, slug: product.slug });

		const idBySlug = new Map(inserted.map((row) => [row.slug, row.id]));

		const skuRows = catalogue.flatMap((entry) => {
			const productId = idBySlug.get(entry.product.slug);
			if (!productId) throw new Error(`Missing id for ${entry.product.slug}`);
			return entry.skus.map((sku) => ({ ...sku, productId }));
		});

		// Chunked to stay far below Postgres' 65,535 bind-parameter limit.
		for (let i = 0; i < skuRows.length; i += 1_000) {
			await tx.insert(skus).values(skuRows.slice(i, i + 1_000));
		}

		console.log(`Seeded ${catalogue.length} products, ${skuRows.length} SKUs.`);
	});
}

/** The home page reads cached stats, so refresh them or it shows zeros for a day. */
async function refreshStatsCache() {
	try {
		const stats = await Promise.race([
			refreshStats(),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("timed out")), 5_000),
			),
		]);
		console.log(
			`Stats refreshed: ${stats.deals} deals, ${stats.warehouses} warehouses.`,
		);
	} catch (error) {
		console.warn(
			"Could not refresh the stats cache (is Valkey running?):",
			error instanceof Error ? error.message.split("\n")[0] : error,
		);
	}
}

try {
	await seed();
	await refreshStatsCache();
	process.exit(0);
} catch (error) {
	console.error(error);
	process.exit(1);
}
