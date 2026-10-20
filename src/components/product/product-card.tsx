import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardFooter } from "#/components/ui/card";
import { formatPrice, useCartApi } from "#/lib/cart";

export type Product = {
	id: string;
	name: string;
	price: number;
	image: string;
	department: "men" | "women" | "kids";
	category: string;
	badge?: string;
};

export function ProductCard({ product }: { product: Product }) {
	const { addItem } = useCartApi();

	return (
		<Card className="overflow-hidden pt-0">
			<div className="relative aspect-square overflow-hidden bg-muted">
				<img
					src={product.image}
					alt={product.name}
					className="size-full object-cover transition-transform duration-300 hover:scale-105"
				/>
				{product.badge && (
					<Badge className="absolute top-3 left-3">{product.badge}</Badge>
				)}
			</div>
			<CardContent className="space-y-1">
				<h3 className="font-medium">{product.name}</h3>
				<p className="text-muted-foreground">{formatPrice(product.price)}</p>
			</CardContent>
			<CardFooter>
				<Button
					className="w-full"
					onClick={() =>
						addItem({
							id: product.id,
							name: product.name,
							price: product.price,
							image: product.image,
						})
					}
				>
					Add to cart
				</Button>
			</CardFooter>
		</Card>
	);
}
