import { formatPrice } from "#/components/cart/cart-provider";

export const isOnSale = (price: number, originalPrice: number | null) =>
	originalPrice !== null && originalPrice > price;

type PriceProps = {
	price: number;
	originalPrice: number | null;
	currency: string;
};

export function Price({ price, originalPrice, currency }: PriceProps) {
	return (
		<>
			{formatPrice(price, currency)}
			{originalPrice !== null && originalPrice > price && (
				<span className="ml-2 text-muted-foreground line-through">
					{formatPrice(originalPrice, currency)}
				</span>
			)}
		</>
	);
}
