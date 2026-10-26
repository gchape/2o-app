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
			<span className="text-price">{formatPrice(price, currency)}</span>
			{isOnSale(price, originalPrice) && (
				<span className="ml-2 text-[0.8em] font-normal text-price-original line-through">
					{formatPrice(originalPrice, currency)}
				</span>
			)}
		</>
	);
}
