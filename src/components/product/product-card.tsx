import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardFooter } from "#/components/ui/card";
import { isOnSale, Price } from "./price";

export type ProductCardData = {
	id: string;
	slug: string;
	name: string;
	brand: string | null;
	currency: string;
	price: number;
	originalPrice: number | null;
	image: string | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
	const { slug, name, brand, image, price, originalPrice, currency } = product;

	return (
		<Card className="overflow-hidden pt-0">
			<Link
				to="/product/$slug"
				params={{ slug }}
				className="relative block aspect-square overflow-hidden bg-muted"
			>
				{image && (
					<img
						src={image}
						alt={name}
						className="size-full object-cover transition-transform duration-300 hover:scale-105"
					/>
				)}
				{isOnSale(price, originalPrice) && (
					<Badge className="absolute top-3 left-3">Sale</Badge>
				)}
			</Link>

			<CardContent className="space-y-1">
				{brand && <p className="text-muted-foreground text-xs">{brand}</p>}
				<h3 className="font-medium">
					<Link to="/product/$slug" params={{ slug }}>
						{name}
					</Link>
				</h3>
				<p className="text-muted-foreground">
					<Price
						price={price}
						originalPrice={originalPrice}
						currency={currency}
					/>
				</p>
			</CardContent>

			<CardFooter>
				<Button
					className="w-full"
					nativeButton={false}
					render={
						<Link to="/product/$slug" params={{ slug }}>
							Choose size
						</Link>
					}
				/>
			</CardFooter>
		</Card>
	);
}
