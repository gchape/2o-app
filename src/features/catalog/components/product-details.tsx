import { Container } from "#/components/layout/container";
import { Badge } from "#/components/ui/badge";
import { site } from "#/data/site";
import { AddToCartButton } from "#/features/cart/components/add-to-cart-button";
import type { ProductDetail } from "#/features/catalog/product.functions";
import type { SkuSelection } from "#/features/catalog/product-selection";
import { useTranslation } from "#/i18n/translate";
import { isOnSale, usePriceFormatter } from "#/lib/price";
import { OptionGroup } from "./option-group";
import { Price } from "./price";
import { ProductImage } from "./product-image";

type ProductDetailsProps = {
	product: ProductDetail;
	selection: SkuSelection<ProductDetail["skus"][number]>;
	onColorChange: (color: string) => void;
	onSkuChange: (sku: string | undefined) => void;
};

/** Presentational product page; selection state lives in the URL (see the route). */
export function ProductDetails({
	product,
	selection,
	onColorChange,
	onSkuChange,
}: ProductDetailsProps) {
	const { formatPriceCompact } = usePriceFormatter();
	const t = useTranslation();
	const { colors, color, colorSkus, selected, shown, imageUrl } = selection;

	return (
		<Container className="grid items-start gap-8 py-8 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:py-12 lg:gap-20 lg:py-16">
			<ProductImage
				src={imageUrl}
				alt={`${product.name}, ${color}`}
				className="aspect-4/5 rounded-xl"
			/>

			<div className="flex min-w-0 max-w-xl flex-col gap-7 md:py-4 lg:gap-8">
				<div>
					{product.brand && (
						<p className="type-eyebrow mb-3 text-muted-foreground">
							{product.brand}
						</p>
					)}
					<h1 className="type-title text-3xl lg:text-4xl">{product.name}</h1>
					{shown && (
						<p className="mt-5 flex flex-wrap items-center gap-3">
							<span className="type-num text-2xl">
								{!selected && t("From ")}
								<Price
									price={shown.price}
									originalPrice={shown.originalPrice}
									currency={product.currency}
								/>
							</span>
							{isOnSale(shown.price, shown.originalPrice) && (
								<Badge>{t("Sale")}</Badge>
							)}
						</p>
					)}
				</div>

				{shown ? (
					<>
						{colors.length > 1 && (
							<OptionGroup
								legend={
									<>
										{t("Color:")}{" "}
										<span className="font-normal capitalize">{color}</span>
									</>
								}
								className="capitalize"
								value={color}
								options={colors.map((c) => ({ value: c, label: c }))}
								onChange={(next) => next && onColorChange(next)}
							/>
						)}

						<OptionGroup
							legend={t("Size")}
							value={selected?.id}
							options={colorSkus.map((s) => ({
								value: s.id,
								label: s.size,
								soldOut: !s.inStock,
								ariaLabel: t(
									s.inStock ? "Size {{size}}" : "Size {{size}}, sold out",
									{ size: s.size },
								),
							}))}
							onChange={onSkuChange}
						/>

						<div>
							<AddToCartButton sku={selected?.id} />
							<div className="type-caption mt-3 space-y-1 text-muted-foreground">
								<p className="text-foreground">
									{selected
										? selected.inStock
											? t("In stock and ready to order.")
											: t("This size is currently sold out.")
										: t("Select a size to check availability.")}
								</p>
								<p>
									{t("Delivery in Georgia; free over {{price}}.", {
										price: formatPriceCompact(site.delivery.freeFrom),
									})}
								</p>
							</div>
						</div>
					</>
				) : (
					<p className="text-muted-foreground">
						{t("This product is currently unavailable.")}
					</p>
				)}

				{product.description && (
					<p className="type-body max-w-prose border-t pt-8 text-sm text-muted-foreground">
						{product.description}
					</p>
				)}
			</div>
		</Container>
	);
}
