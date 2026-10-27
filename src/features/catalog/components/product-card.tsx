import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import type { ProductListItem } from "#/data/catalog.types";
import { StoreLabel } from "#/features/stores/store-label";
import { useTranslation } from "#/i18n/translate";
import { isOnSale, usePriceFormatter } from "#/lib/price";
import { cn } from "#/lib/utils";
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
	const { formatPriceCompact } = usePriceFormatter();
	const { slug, name, brand, imageUrl, price, originalPrice, currency } =
		product;
	const onSale = isOnSale(price, originalPrice);

	return (
		<Card className="group relative h-full min-w-0 gap-4 overflow-visible rounded-none py-0 ring-0">
			<div className="relative">
				<ProductImage
					src={imageUrl}
					alt=""
					loading={loading}
					className="aspect-4/5 rounded-xl [&_img]:transition-transform [&_img]:duration-500 motion-safe:group-hover:[&_img]:scale-[1.03]"
				/>
				{onSale && <Badge className="absolute top-3 left-3">{t("Sale")}</Badge>}
			</div>

			<CardContent className="flex-1 space-y-2 px-0">
				{brand && (
					<p className="type-eyebrow wrap-anywhere text-muted-foreground">
						{brand}
					</p>
				)}
				<p className="text-xs text-muted-foreground">
					<StoreLabel storeId={product.storeId} />
				</p>
				<h3 className="type-card-title line-clamp-2 min-h-[2.7em] text-sm sm:text-base">
					<Link
						to="/product/$slug"
						params={{ slug }}
						className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4"
					>
						{name}
					</Link>
				</h3>
				<p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1">
					<span className="text-muted-foreground text-xs">{t("From")}</span>
					<span
						className={cn(
							"type-num text-lg sm:text-xl",
							onSale ? "text-price" : "text-slate-700 dark:text-slate-200",
						)}
					>
						{formatPriceCompact(price, currency)}
					</span>
					{onSale && (
						<span className="text-price-original text-sm line-through">
							{formatPriceCompact(originalPrice, currency)}
						</span>
					)}
				</p>
				{onSale && (
					<p className="w-fit rounded-md bg-price-savings px-2 py-1 font-medium text-price text-xs sm:text-sm">
						{t("You save {{price}}", {
							price: formatPriceCompact(originalPrice - price, currency),
						})}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
