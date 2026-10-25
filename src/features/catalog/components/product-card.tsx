import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import type { ProductListItem } from "#/data/catalog.types";
import { useTranslation } from "#/i18n/translate";
import { isOnSale } from "#/lib/price";
import { Price } from "./price";
import { ProductImage } from "./product-image";

/**
 * The whole card is one link (a "stretched link" on the name) rather than
 * three separate links to the same page, which keeps keyboard and screen-reader
 * navigation to a single stop per product.
 */
export function ProductCard({
	product,
	loading,
}: {
	product: ProductListItem;
	loading?: "lazy" | "eager";
}) {
	const t = useTranslation();
	const { slug, name, brand, imageUrl, price, originalPrice, currency } =
		product;

	return (
		<Card className="group relative h-full min-w-0 gap-4 overflow-visible rounded-none py-0 ring-0">
			<div className="relative">
				<ProductImage
					src={imageUrl}
					alt=""
					loading={loading}
					className="aspect-4/5 rounded-xl [&_img]:transition-transform [&_img]:duration-500 motion-safe:group-hover:[&_img]:scale-[1.03]"
				/>
				{isOnSale(price, originalPrice) && (
					<Badge className="absolute top-3 left-3">{t("Sale")}</Badge>
				)}
			</div>

			<CardContent className="flex-1 space-y-2 px-0">
				{brand && (
					<p className="type-eyebrow wrap-anywhere text-muted-foreground">
						{brand}
					</p>
				)}
				<h3 className="type-card-title line-clamp-2 min-h-[2.7em] text-sm sm:text-base">
					<Link
						to="/product/$slug"
						params={{ slug }}
						className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4"
					>
						{name}
					</Link>
				</h3>
				<p className="type-num text-foreground text-sm sm:text-base">
					<Price
						price={price}
						originalPrice={originalPrice}
						currency={currency}
					/>
				</p>
			</CardContent>
		</Card>
	);
}
