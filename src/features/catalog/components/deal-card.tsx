import { Link } from "@tanstack/react-router";
import type { Deal } from "#/features/catalog/product.types";
import { formatPriceCompact } from "#/lib/price";
import { cn } from "#/lib/utils";
import { ProductImage } from "./product-image";
import { SkewTag } from "./skew-tag";

/** Cards this far down a row or grid are usually below the fold. */
const EAGER_IMAGE_COUNT = 4;

/** Image loading strategy for the card at `index` in a list of deals. */
export const dealImageLoading = (index: number) =>
	index < EAGER_IMAGE_COUNT ? "eager" : "lazy";

type DealCardProps = {
	deal: Deal;
	loading?: "lazy" | "eager";
	className?: string;
};

/** One-link card (stretched link on the name) for a discounted product. */
export function DealCard({ deal, loading, className }: DealCardProps) {
	const {
		slug,
		name,
		brand,
		imageUrl,
		price,
		originalPrice,
		currency,
		discount,
	} = deal;

	return (
		<article className={cn("group relative", className)}>
			<div className="relative">
				<ProductImage
					src={imageUrl}
					alt=""
					loading={loading}
					className="aspect-4/5 rounded-xl [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-105"
				/>
				<SkewTag className="type-num absolute top-3 left-3 text-sm">
					−{discount}%
				</SkewTag>
			</div>

			<div className="mt-3 space-y-1">
				{brand && <p className="text-muted-foreground text-xs">{brand}</p>}
				<h3 className="font-medium leading-snug">
					<Link
						to="/product/$slug"
						params={{ slug }}
						className="after:absolute after:inset-0"
					>
						{name}
					</Link>
				</h3>
				<p className="flex items-baseline gap-2 pt-1">
					<span className="text-muted-foreground text-xs">From</span>
					<span className="type-num text-xl">
						{formatPriceCompact(price, currency)}
					</span>
					<span className="text-muted-foreground text-sm line-through">
						{formatPriceCompact(originalPrice, currency)}
					</span>
				</p>
				<p className="font-semibold text-green-700 text-sm">
					You save {formatPriceCompact(originalPrice - price, currency)}
				</p>
			</div>
		</article>
	);
}
