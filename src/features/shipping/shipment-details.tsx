import { Link } from "@tanstack/react-router";
import type { CartItem } from "#/features/cart/cart";
import { storeIdSchema } from "#/features/stores/store";
import { StoreLabel } from "#/features/stores/store-label";
import { useTranslation } from "#/i18n/translate";
import { usePriceFormatter } from "#/lib/price";
import { estimateShipment, type ShipmentQuote } from "./shipping";

export function ShipmentDetails({
	number,
	items,
	quote,
	onBrowse,
}: {
	number: number;
	items: CartItem[];
	quote?: ShipmentQuote;
	onBrowse?: () => void;
}) {
	const t = useTranslation();
	const storeId = storeIdSchema.safeParse(
		quote?.groupId ?? items[0]?.shipping?.groupId,
	).data;
	const { formatPrice } = usePriceFormatter();
	const usd = (value: number) => formatPrice(value, "USD");
	const amounts = quote ?? estimateShipment(items);
	const rule = quote?.rule ?? items[0]?.shipping?.rule;
	const remaining =
		amounts && rule?.freeFromUsd != null
			? Math.max(0, rule.freeFromUsd - amounts.subtotalUsd)
			: null;
	return (
		<div className="space-y-2 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed">
			<h3 className="text-sm font-semibold">
				{t("Shipment {{number}}", { number })}
			</h3>
			{storeId && (
				<p className="text-muted-foreground">
					<StoreLabel storeId={storeId} />
				</p>
			)}
			{amounts ? (
				<>
					<p>
						{t("Shipment items: {{amount}}", {
							amount: usd(amounts.subtotalUsd),
						})}
					</p>
					<p>
						{t(
							quote ? "Shipping: {{amount}}" : "Estimated shipping: {{amount}}",
							{
								amount:
									amounts.shippingUsd === 0
										? t("Free")
										: usd(amounts.shippingUsd),
							},
						)}
					</p>
				</>
			) : (
				<p>
					{t(
						rule
							? "Shipping estimate unavailable. Your final cost will be shown before payment."
							: "Shipping is not available for some items. Please review your cart or contact us.",
					)}
				</p>
			)}
			{rule && rule.flatRateUsd > 0 && rule.freeFromUsd !== null && (
				<p className="text-muted-foreground">
					{!quote && remaining !== null && remaining > 0
						? t("Add {{amount}} from this store for free shipping.", {
								amount: usd(remaining),
							})
						: t("Free shipping from {{amount}} for this shipment only.", {
								amount: usd(rule.freeFromUsd),
							})}
				</p>
			)}
			{storeId && !quote && (
				<Link
					to="/stores/$storeId"
					params={{ storeId }}
					onClick={onBrowse}
					className="inline-flex min-h-10 items-center text-link underline underline-offset-4"
				>
					{t("Shop more from this store")}
				</Link>
			)}
		</div>
	);
}
