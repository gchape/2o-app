import { sortSkus } from "#/data/sizes";
import { db } from "#/db";
import { publicStoreId } from "#/features/stores/store.server";

export const findProductBySlug = async (slug: string) => {
	const found = await db.query.product.findFirst({
		where: { slug },
		columns: {
			id: true,
			slug: true,
			name: true,
			brand: true,
			description: true,
			department: true,
			category: true,
			currency: true,
			warehouse: true,
		},
		with: { skus: { columns: { productId: false } } },
	});

	if (!found) return undefined;
	return {
		id: found.id,
		slug: found.slug,
		name: found.name,
		brand: found.brand,
		description: found.description,
		department: found.department,
		category: found.category,
		currency: found.currency,
		storeId: publicStoreId(found.warehouse),
		skus: sortSkus(found.skus, found.category),
	};
};
