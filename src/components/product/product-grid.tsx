import { ProductCard, type ProductCardData } from "./product-card";

export function ProductGrid({ products }: { products: ProductCardData[] }) {
	if (products.length === 0) {
		return <p className="py-10 text-muted-foreground">No products yet.</p>;
	}

	return (
		<div className="grid grid-cols-2 gap-4 py-6 md:grid-cols-3 lg:grid-cols-4">
			{products.map((p) => (
				<ProductCard key={p.id} product={p} />
			))}
		</div>
	);
}
