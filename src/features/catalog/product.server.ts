import { db } from "#/db";
import { sortSkus } from "./sizes";

export const findProductBySlug = async (slug: string) => {
	const found = await db.query.product.findFirst({
		where: { slug },
		columns: { url: false },
		with: { skus: { columns: { productId: false } } },
	});

	return found && { ...found, skus: sortSkus(found.skus, found.category) };
};
