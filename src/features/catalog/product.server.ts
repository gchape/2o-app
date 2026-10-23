import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import type { Category, Department } from "#/data/catalog";
import { db } from "#/db";
import { product, skus } from "#/db/schema";
import type { Deal, ProductListItem } from "./product.types";
import { sortSkus } from "./sizes";

/**
 * One page of products, one row each, priced at its cheapest in-stock SKU.
 * Ordered by name (then id) so pages never overlap or skip.
 */
export const listProducts = async (
	department: Department,
	category: Category | undefined,
	limit: number,
	offset = 0,
): Promise<ProductListItem[]> => {
	const rows = await db.query.product.findMany({
		where: { department, category, skus: { inStock: true } },
		columns: { id: true, slug: true, name: true, brand: true, currency: true },
		with: {
			skus: {
				where: { inStock: true },
				orderBy: { price: "asc", id: "asc" },
				limit: 1,
				columns: { price: true, originalPrice: true, imageUrl: true },
			},
		},
		orderBy: { name: "asc", id: "asc" },
		limit,
		offset,
	});

	return rows.flatMap(({ skus: [sku], ...p }) =>
		sku ? [{ ...p, ...sku }] : [],
	);
};

/**
 * An in-stock SKU with a real discount. Uses the generated `skus.discount`
 * column, so the predicate matches the partial `skus_deals_idx` index.
 */
export const onSale = and(eq(skus.inStock, true), gt(skus.discount, 0));

/**
 * One row per product on sale, shown at its deepest-discounted in-stock SKU
 * and ordered by discount percentage, biggest first.
 */
export const listDeals = (limit: number, offset = 0): Promise<Deal[]> => {
	const best = db
		.selectDistinctOn([product.id], {
			id: product.id,
			slug: product.slug,
			name: product.name,
			brand: product.brand,
			currency: product.currency,
			price: skus.price,
			// `onSale` guarantees it is set, so narrow the type here.
			originalPrice: sql<number>`${skus.originalPrice}`.as("original_price"),
			imageUrl: skus.imageUrl,
			discount: skus.discount,
		})
		.from(product)
		.innerJoin(skus, eq(skus.productId, product.id))
		.where(onSale)
		.orderBy(product.id, desc(skus.discount), asc(skus.id))
		.as("best");

	return db
		.select()
		.from(best)
		.orderBy(desc(best.discount), asc(best.id))
		.limit(limit)
		.offset(offset);
};

export const findProductBySlug = async (slug: string) => {
	const found = await db.query.product.findFirst({
		where: { slug },
		columns: { url: false },
		with: { skus: { columns: { productId: false } } },
	});

	return found && { ...found, skus: sortSkus(found.skus, found.category) };
};
