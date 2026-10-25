import { isOnSale, usePriceFormatter } from "#/lib/price";

type PriceProps = {
	price: number;
	originalPrice: number | null;
	currency: string;
};

export function Price({ price, originalPrice, currency }: PriceProps) {
	const { formatPrice } = usePriceFormatter();
	return (
		<>
			{formatPrice(price, currency)}
			{isOnSale(price, originalPrice) && (
				<span className="ml-2 text-[0.8em] font-normal text-muted-foreground line-through">
					{formatPrice(originalPrice, currency)}
				</span>
			)}
		</>
	);
}
