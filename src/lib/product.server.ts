import { and, asc, eq } from "drizzle-orm";
import { db } from "#/db";
import { product, skus } from "#/db/schema";
import type { Category, Department } from "./product.schema";

const CLOTHING_SIZES = ["xxs", "xs", "s", "m", "l", "xl", "2xl", "xxl", "3xl"];

const sizeRank: Record<Category, (size: string) => number> = {
	shoes: Number,
	clothing: (size) => CLOTHING_SIZES.indexOf(size.toLowerCase()),
};

const compareSizes = (category: Category, a: string, b: string) =>
	sizeRank[category](a) - sizeRank[category](b) ||
	a.localeCompare(b, undefined, { numeric: true });

export async function listProducts(
	department: Department,
	category?: Category,
) {
	return db
		.selectDistinctOn([product.id], {
			id: product.id,
			slug: product.slug,
			name: product.name,
			brand: product.brand,
			currency: product.currency,
			price: skus.price,
			originalPrice: skus.originalPrice,
			image: skus.imageUrl,
		})
		.from(product)
		.innerJoin(skus, eq(skus.productId, product.id))
		.where(
			and(
				eq(product.department, department),
				category ? eq(product.category, category) : undefined,
				eq(skus.inStock, true),
			),
		)
		.orderBy(product.id, asc(skus.price), asc(skus.id));
}

export async function findProductBySlug(slug: string) {
	const found = await db.query.product.findFirst({
		where: { slug },
		columns: {
			id: true,
			slug: true,
			name: true,
			brand: true,
			description: true,
			currency: true,
			category: true,
		},
		with: {
			skus: {
				columns: {
					id: true,
					color: true,
					size: true,
					imageUrl: true,
					price: true,
					originalPrice: true,
					inStock: true,
				},
			},
		},
	});

	if (!found) return null;

	return {
		...found,
		skus: found.skus.toSorted(
			(a, b) =>
				a.color.localeCompare(b.color) ||
				compareSizes(found.category, a.size, b.size),
		),
	};
}
