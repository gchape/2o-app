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
		<Card className="group relative h-full min-w-0 gap-4 overflow-visible rounded-none py-0 ring-0">
			<div className="relative">
				<ProductImage
					src={imageUrl}
					alt=""
					className="aspect-4/5 rounded-xl [&_img]:transition-transform [&_img]:duration-500 motion-safe:group-hover:[&_img]:scale-[1.03]"
				/>
				{isOnSale(price, originalPrice) && (
					<Badge className="absolute top-3 left-3">Sale</Badge>
				)}
			</div>

			<CardContent className="flex-1 space-y-2 px-0">
				{brand && <p className="type-eyebrow text-muted-foreground">{brand}</p>}
				<h3 className="min-h-11 text-sm font-medium leading-snug tracking-tight sm:text-base">
					<Link
						to="/product/$slug"
						params={{ slug }}
						className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4"
					>
						{name}
					</Link>
				</h3>
				<p className="text-muted-foreground text-sm font-semibold tabular-nums sm:text-base">
					<Price
						price={price}
						originalPrice={originalPrice}
						currency={currency}
					/>
				</p>
			</CardContent>

			<CardFooter className="px-0">
				{/* Visual affordance only; the stretched link above does the work. */}
				<span
					aria-hidden
					className={cn(
						buttonVariants(),
						"h-11 w-full rounded-lg text-xs sm:text-sm",
					)}
				>
					Choose size
				</span>
			</CardFooter>
		</Card>
	);
}
