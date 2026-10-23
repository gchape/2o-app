import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import { Card, CardContent, CardFooter } from "#/components/ui/card";
import type { ProductListItem } from "#/features/catalog/product.types";
import { isOnSale } from "#/lib/price";
import { cn } from "#/lib/utils";
import { Price } from "./price";
import { ProductImage } from "./product-image";

/**
 * The whole card is one link (a "stretched link" on the name) rather than
 * three separate links to the same page, which keeps keyboard and screen-reader
 * navigation to a single stop per product.
 */
export function ProductCard({ product }: { product: ProductListItem }) {
	const { slug, name, brand, imageUrl, price, originalPrice, currency } =
		product;

	return (
		<Card className="group relative overflow-hidden pt-0">
			<div className="relative">
				<ProductImage
					src={imageUrl}
					alt=""
					className="aspect-square [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-105"
				/>
				{isOnSale(price, originalPrice) && (
					<Badge className="absolute top-3 left-3">Sale</Badge>
				)}
			</div>

			<CardContent className="space-y-1">
				{brand && <p className="text-muted-foreground text-xs">{brand}</p>}
				<h3 className="font-medium">
					<Link
						to="/product/$slug"
						params={{ slug }}
						className="after:absolute after:inset-0"
					>
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
				{/* Visual affordance only; the stretched link above does the work. */}
				<span aria-hidden className={cn(buttonVariants(), "w-full")}>
					Choose size
				</span>
			</CardFooter>
		</Card>
	);
}
