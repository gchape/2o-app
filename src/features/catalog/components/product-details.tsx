import { Container } from "#/components/layout/container";
import { Badge } from "#/components/ui/badge";
import { AddToCartButton } from "#/features/cart/components/add-to-cart-button";
import type { ProductDetail } from "#/features/catalog/product.functions";
import type { SkuSelection } from "#/features/catalog/product-selection";
import { isOnSale } from "#/lib/price";
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
	const { colors, color, colorSkus, selected, shown, imageUrl } = selection;

	return (
		<Container className="grid gap-8 py-8 md:grid-cols-2">
			<ProductImage
				src={imageUrl}
				alt={`${product.name}, ${color}`}
				className="aspect-square rounded-xl"
			/>

			<div className="flex flex-col gap-6">
				<div>
					{product.brand && (
						<p className="text-muted-foreground text-sm">{product.brand}</p>
					)}
					<h1 className="font-bold text-3xl tracking-tight">{product.name}</h1>
					{shown && (
						<p className="mt-2 flex items-center gap-2 text-xl">
							<span className="font-semibold">
								{!selected && "From "}
								<Price
									price={shown.price}
									originalPrice={shown.originalPrice}
									currency={product.currency}
								/>
							</span>
							{isOnSale(shown.price, shown.originalPrice) && (
								<Badge>Sale</Badge>
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
										Color:{" "}
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
							legend="Size"
							value={selected?.id}
							options={colorSkus.map((s) => ({
								value: s.id,
								label: s.size,
								soldOut: !s.inStock,
								ariaLabel: `Size ${s.size}${s.inStock ? "" : ", sold out"}`,
							}))}
							onChange={onSkuChange}
						/>

						<AddToCartButton sku={selected?.id} />
					</>
				) : (
					<p className="text-muted-foreground">
						This product is currently unavailable.
					</p>
				)}

				{product.description && (
					<p className="max-w-prose text-muted-foreground">
						{product.description}
					</p>
				)}
			</div>
		</Container>
	);
}
