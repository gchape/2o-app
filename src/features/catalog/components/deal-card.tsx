import { Link } from "@tanstack/react-router";
import type { Deal } from "#/data/catalog.types";
import { StoreLabel } from "#/features/stores/store-label";
import { useTranslation } from "#/i18n/translate";
import { usePriceFormatter } from "#/lib/price";
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
	const { formatPriceCompact } = usePriceFormatter();
	const t = useTranslation();
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
					className="aspect-4/5 rounded-xl [&_img]:transition-transform [&_img]:duration-500 motion-safe:group-hover:[&_img]:scale-[1.03]"
				/>
				<SkewTag className="type-num absolute top-3 left-3 text-sm">
					−{discount}%
				</SkewTag>
			</div>

			<div className="mt-5 space-y-2">
				{brand && <p className="type-eyebrow text-muted-foreground">{brand}</p>}
				<p className="text-xs text-muted-foreground">
					<StoreLabel storeId={deal.storeId} />
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
					<span className="type-num text-lg text-price sm:text-xl">
						{formatPriceCompact(price, currency)}
					</span>
					<span className="text-price-original text-sm line-through">
						{formatPriceCompact(originalPrice, currency)}
					</span>
				</p>
				<p className="w-fit rounded-md bg-price-savings px-2 py-1 font-medium text-price text-xs sm:text-sm">
					{t("You save {{price}}", {
						price: formatPriceCompact(originalPrice - price, currency),
					})}
				</p>
			</div>
		</article>
	);
}
