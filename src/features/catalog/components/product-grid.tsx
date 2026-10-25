import type { ProductListItem } from "#/data/catalog.types";
import { useTranslation } from "#/i18n/translate";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: ProductListItem[] }) {
	const t = useTranslation();
	if (products.length === 0) {
		return (
			<p className="py-10 text-muted-foreground">{t("No products yet.")}</p>
		);
	}

	return (
		<ul className="grid grid-cols-2 gap-x-4 gap-y-10 py-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
			{products.map((p, index) => (
				<li key={p.id} className="min-w-0">
					<ProductCard product={p} loading={index < 4 ? "eager" : "lazy"} />
				</li>
			))}
		</ul>
	);
}
